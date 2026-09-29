import { Router } from "express";
import { asyncHandler, respond } from "../utils/http";
import { pingDb } from "../config/db";
import { pingCache } from "../config/cache";
import { queue } from "../jobs/queue";
import { ffmpeg } from "../media/ffmpeg";

export const healthRouter: Router = Router();

/** Liveness: process is up; does not touch dependencies (REQ-SYS-413). */
healthRouter.get("/health", (_req, res) => {
  res.status(200).json({ success: true, data: { status: "ok", uptimeSec: Math.round(process.uptime()) }, meta: {}, error: null });
});

/** Readiness: checks DB + in-memory cache (REQ-SYS-413). */
healthRouter.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    await pingDb();
    await pingCache();
    return respond(res, 200, { status: "ready", db: "up", cache: "up" });
  }),
);

/** Operational metrics: dependency health + queue depths + worker env (REQ-SYS-043). */
healthRouter.get(
  "/metrics",
  asyncHandler(async (_req, res) => {
    const checks: Record<string, unknown> = {};

    try {
      await pingDb();
      checks.db = "up";
    } catch {
      checks.db = "down";
    }
    try {
      await pingCache();
      checks.cache = "up";
    } catch {
      checks.cache = "down";
    }

    const queueNames = [
      "media_probe",
      "media_transcode",
      "media_poster",
      "media_delete",
      "notification_push",
      "email_send",
      "sms_send",
      "article_scheduled_publish",
    ] as const;

    const queues: Record<string, number | null> = {};
    for (const q of queueNames) {
      try {
        const m = await queue.metrics(q);
        queues[q] = m ? Number(m.queue_length) : 0;
      } catch {
        queues[q] = null;
      }
    }

    checks.ffmpeg = (await ffmpeg.isAvailable()) ? "available" : "missing";
    checks.memoryMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

    return respond(res, 200, { status: "ok", checks, queues });
  }),
);
