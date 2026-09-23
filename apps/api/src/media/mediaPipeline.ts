import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { logger } from "../config/logger";
import { ffmpeg } from "./ffmpeg";
import { publicUrl, downloadToFile, uploadFile } from "../config/r2";
import { mediaAssets } from "../db/schema";
import { queue } from "../jobs/queue";
import { notificationService } from "../services/engagement.service";

/**
 * Media processing pipeline (REQ-REP-096, docs/architecture/03 §6.6):
 *   media.probe -> media.transcode -> media.poster -> ready
 * Images skip straight to a variants/blurhash step (simplified to `ready`).
 */

const TMP = "/tmp/newswatch-media";

export const mediaPipeline = {
  /** Mark an asset as processing and dispatch the first job. */
  async enqueueProcessing(assetId: string): Promise<void> {
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
    if (!asset) return;
    await db
      .update(mediaAssets)
      .set({ status: "processing", processingStatus: "processing", processingError: null })
      .where(eq(mediaAssets.id, assetId));

    if (asset.kind === "video") {
      await queue.send("media_probe", {
        eventId: `probe:${assetId}`,
        occurredAt: new Date().toISOString(),
        data: { assetId },
      });
    } else {
      await queue.send("media_transcode", {
        eventId: `image:${assetId}`,
        occurredAt: new Date().toISOString(),
        data: { assetId },
      });
    }
  },

  /** ffprobe the original: duration, dimensions, codec (REQ-REP-096). */
  async probe(assetId: string): Promise<void> {
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
    if (!asset) return;

    try {
      const { mkdir } = await import("node:fs/promises");
      await mkdir(TMP, { recursive: true });
      const local = `${TMP}/${assetId}.src`;
      await downloadToFile(asset.storageKey, local);
      const result = await ffmpeg.probe(local);

      await db
        .update(mediaAssets)
        .set({
          durationSeconds: result.durationSeconds != null ? String(result.durationSeconds) : null,
          width: result.width,
          height: result.height,
          codec: result.codec,
        })
        .where(eq(mediaAssets.id, assetId));

      await queue.send("media_transcode", {
        eventId: `transcode:${assetId}`,
        occurredAt: new Date().toISOString(),
        data: { assetId },
      });
    } catch (err) {
      await this.markFailed(assetId, err);
      throw err;
    }
  },

  /** Transcode (video) or optimise (image) and set the canonical URL. */
  async transcode(assetId: string): Promise<void> {
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
    if (!asset) return;

    try {
      const { mkdir } = await import("node:fs/promises");
      await mkdir(TMP, { recursive: true });

      if (asset.kind === "image") {
        // Images are served as uploaded; record the deliverable URL.
        await db
          .update(mediaAssets)
          .set({ url: publicUrl(asset.storageKey), status: "ready", processingStatus: "ready" })
          .where(eq(mediaAssets.id, assetId));
        return;
      }

      const localSrc = `${TMP}/${assetId}.src`;
      const localMp4 = `${TMP}/${assetId}.mp4`;
      await downloadToFile(asset.storageKey, localSrc);

      const available = await ffmpeg.isAvailable();
      const variants: Record<string, string> = {};
      let canonicalKey = asset.storageKey;

      if (available) {
        await ffmpeg.transcodeToMp4(localSrc, localMp4);
        const mp4Key = `media/video/${assetId}.mp4`;
        await uploadFile(mp4Key, localMp4, "video/mp4");
        canonicalKey = mp4Key;
        variants.mp4 = publicUrl(mp4Key);
      } else {
        logger.warn({ assetId }, "ffmpeg unavailable; using original as canonical video");
        variants.original = publicUrl(asset.storageKey);
      }

      await db
        .update(mediaAssets)
        .set({
          url: publicUrl(canonicalKey),
          variants,
          codec: asset.codec ?? "h264",
        })
        .where(eq(mediaAssets.id, assetId));

      await queue.send("media_poster", {
        eventId: `poster:${assetId}`,
        occurredAt: new Date().toISOString(),
        data: { assetId },
      });
    } catch (err) {
      await this.markFailed(assetId, err);
      throw err;
    }
  },

  /** Extract a poster frame, store it as an image asset, link it back. */
  async poster(assetId: string): Promise<void> {
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
    if (!asset) return;

    try {
      const { mkdir } = await import("node:fs/promises");
      await mkdir(TMP, { recursive: true });
      const localSrc = `${TMP}/${assetId}.src`;
      const localJpg = `${TMP}/${assetId}.jpg`;

      const available = await ffmpeg.isAvailable();
      if (available) {
        // Prefer the transcoded MP4 if present.
        const mp4Key = `media/video/${assetId}.mp4`;
        try {
          await downloadToFile(mp4Key, localSrc);
        } catch {
          await downloadToFile(asset.storageKey, localSrc);
        }
        await ffmpeg.extractPoster(localSrc, localJpg);
        const posterKey = `media/poster/${assetId}.jpg`;
        await uploadFile(posterKey, localJpg, "image/jpeg");

        const [posterAsset] = await db
          .insert(mediaAssets)
          .values({
            ownerId: asset.ownerId,
            purpose: "poster",
            kind: "image",
            status: "ready",
            processingStatus: "ready",
            storageKey: posterKey,
            url: publicUrl(posterKey),
            mimeType: "image/jpeg",
            sizeBytes: 0,
          })
          .returning();
        await db
          .update(mediaAssets)
          .set({ posterMediaId: posterAsset!.id, status: "ready", processingStatus: "ready" })
          .where(eq(mediaAssets.id, assetId));
      } else {
        // No ffmpeg: finish without a poster rather than blocking publication.
        await db
          .update(mediaAssets)
          .set({ status: "ready", processingStatus: "ready" })
          .where(eq(mediaAssets.id, assetId));
      }

      // Notify the owner that the upload is ready.
      await notificationService
        .create({
          userId: asset.ownerId,
          type: "reporter_article_status",
          title: "Media ready",
          body: "Your uploaded media finished processing.",
          entityType: "media",
          entityId: assetId,
        })
        .catch(() => undefined);
    } catch (err) {
      await this.markFailed(assetId, err);
      throw err;
    }
  },

  /** Remove originals, renditions, and poster objects after a soft delete. */
  async deleteObjects(assetId: string): Promise<void> {
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
    if (!asset) return;
    const { deleteObject } = await import("../config/r2");
    await deleteObject(asset.storageKey).catch(() => undefined);
    await deleteObject(`media/video/${assetId}.mp4`).catch(() => undefined);
    await deleteObject(`media/poster/${assetId}.jpg`).catch(() => undefined);
  },

  async markFailed(assetId: string, err: unknown): Promise<void> {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ assetId, err }, "media processing failed");
    await db
      .update(mediaAssets)
      .set({ status: "failed", processingStatus: "failed", processingError: message.slice(0, 500) })
      .where(eq(mediaAssets.id, assetId));
  },

  /** Guard used before attaching media to articles (REQ-REP-099). */
  async assertReady(assetId: string) {
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(and(eq(mediaAssets.id, assetId), isNull(mediaAssets.deletedAt)))
      .limit(1);
    return asset ?? null;
  },
};

