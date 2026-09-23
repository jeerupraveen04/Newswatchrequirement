import { logger } from "../config/logger";
import { env } from "../config/env";
import { closeDb } from "../db/client";
import { runWorker, queue } from "./queue";
import { mediaPipeline } from "../media/mediaPipeline";
import { notificationWorker } from "./handlers/notification.handler";
import { emailWorker } from "./handlers/email.handler";
import { smsWorker } from "./handlers/sms.handler";
import { scheduledPublishWorker } from "./handlers/scheduledPublish.handler";

/**
 * Worker entry point. Runs pgmq consumer loops in one process
 * (docs/architecture/03 §8). Start with `pnpm --filter @newswatch/api worker`.
 */
async function main() {
  const controller = new AbortController();
  const { signal } = controller;

  const stop = async () => {
    logger.info("Worker shutting down...");
    controller.abort();
    await closeDb();
    process.exit(0);
  };
  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());

  if (!env.MEDIA_WORKER_ENABLED) {
    logger.warn("MEDIA_WORKER_ENABLED=false — media workers not started");
  }

  logger.info("Starting pgmq workers...");

  const loops: Array<Promise<void>> = [];

  if (env.MEDIA_WORKER_ENABLED) {
    loops.push(
      runWorker<{ assetId: string }>("media_probe", async (data) => {
        await mediaPipeline.probe(data.assetId);
      }, { signal }),
    );
    loops.push(
      runWorker<{ assetId: string }>("media_transcode", async (data) => {
        await mediaPipeline.transcode(data.assetId);
      }, { signal }),
    );
    loops.push(
      runWorker<{ assetId: string }>("media_poster", async (data) => {
        await mediaPipeline.poster(data.assetId);
      }, { signal }),
    );
    loops.push(
      runWorker<{ assetId: string }>("media_delete", async (data) => {
        await mediaPipeline.deleteObjects(data.assetId);
      }, { signal }),
    );
  }

  loops.push(
    runWorker<{ userId: string; title: string; body: string; deepLink?: string }>(
      "notification_push",
      async (data) => {
        await notificationWorker(data);
      },
      { signal },
    ),
    runWorker<{ to: string; subject: string; html: string }>("email_send", async (data) => {
      await emailWorker(data);
    }, { signal }),
    runWorker<{ to: string; text: string }>("sms_send", async (data) => {
      await smsWorker(data);
    }, { signal }),
    runWorker<{ articleId: string }>("article_scheduled_publish", async (data) => {
      await scheduledPublishWorker(data);
    }, { signal }),
  );

  // Expose queue metrics periodically (best-effort observability).
  if (env.NODE_ENV !== "test") {
    setInterval(() => {
      void (async () => {
        try {
          const m = await queue.metrics("media_probe");
          logger.debug({ mediaProbeQueue: m }, "queue metrics");
        } catch {
          /* ignore */
        }
      })();
    }, 60_000);
  }

  await Promise.all(loops);
}

main().catch((e) => {
  logger.error(e, "Worker fatal error");
  process.exit(1);
});
