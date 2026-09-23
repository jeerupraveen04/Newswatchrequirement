import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "../config/env";
import { logger } from "../config/logger";

const exec = promisify(execFile);

/**
 * FFmpeg/FFprobe wrapper used by the media workers
 * (docs/architecture/03-backend-architecture.md §6.6).
 *
 * The binaries are resolved from FFMPEG_PATH / FFPROBE_PATH (default `ffmpeg`
 * / `ffprobe`). When a binary is not installed, `isAvailable()` returns false
 * and callers fall back gracefully so the queue pipeline still completes.
 */

export interface ProbeResult {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  codec: string | null;
}

export const ffmpeg = {
  bin: env.FFMPEG_PATH || "ffmpeg",
  probeBin: env.FFPROBE_PATH || "ffprobe",

  async isAvailable(): Promise<boolean> {
    try {
      await exec(this.bin, ["-version"], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },

  async probe(inputPath: string): Promise<ProbeResult> {
    try {
      const { stdout } = await exec(
        this.probeBin,
        [
          "-v",
          "error",
          "-print_format",
          "json",
          "-show_format",
          "-show_streams",
          inputPath,
        ],
        { maxBuffer: 10 * 1024 * 1024, timeout: 60_000 },
      );
      const parsed = JSON.parse(stdout) as {
        streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number; duration?: string }>;
        format?: { duration?: string };
      };
      const video = parsed.streams?.find((s) => s.codec_type === "video");
      const duration = Number(parsed.format?.duration ?? video?.duration ?? 0);
      return {
        durationSeconds: Number.isFinite(duration) && duration > 0 ? Math.round(duration * 1000) / 1000 : null,
        width: video?.width ?? null,
        height: video?.height ?? null,
        codec: video?.codec_name ?? null,
      };
    } catch (err) {
      logger.warn({ err, inputPath }, "ffprobe failed; returning empty probe");
      return { durationSeconds: null, width: null, height: null, codec: null };
    }
  },

  /** Transcode to progressive H.264/AAC MP4 (faststart). */
  async transcodeToMp4(inputPath: string, outputPath: string): Promise<void> {
    await exec(
      this.bin,
      [
        "-y",
        "-i",
        inputPath,
        "-c:v",
        "libx264",
        "-profile:v",
        "main",
        "-preset",
        "medium",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      { maxBuffer: 50 * 1024 * 1024, timeout: 30 * 60_000 },
    );
  },

  /** Transcode to WebM (VP9/Opus) as a secondary rendition. */
  async transcodeToWebm(inputPath: string, outputPath: string): Promise<void> {
    await exec(
      this.bin,
      ["-y", "-i", inputPath, "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-c:a", "libopus", outputPath],
      { maxBuffer: 50 * 1024 * 1024, timeout: 30 * 60_000 },
    );
  },

  /** Extract a single JPEG poster frame. */
  async extractPoster(inputPath: string, outputPath: string, atSeconds = 1): Promise<void> {
    await exec(
      this.bin,
      [
        "-y",
        "-ss",
        String(atSeconds),
        "-i",
        inputPath,
        "-frames:v",
        "1",
        "-vf",
        "scale=1280:-2",
        outputPath,
      ],
      { maxBuffer: 20 * 1024 * 1024, timeout: 120_000 },
    );
  },
};
