import { Router } from "express";
import { z } from "zod";
import type { Request, Response } from "express";
import { db } from "../db/client";
import { analyticsEvents } from "../db/schema";
import { asyncHandler, respond } from "../utils/http";
import { validate } from "../middleware/validate";
import { optionalAuth } from "../middleware/auth";

export const analyticsRouter: Router = Router();

const ingestSchema = z.object({
  events: z
    .array(
      z.object({
        eventName: z.string().min(1).max(64),
        clientEventId: z.string().max(64).optional(),
        articleId: z.string().uuid().optional(),
        props: z.record(z.unknown()).optional(),
        platform: z.enum(["ios", "android", "web"]).optional(),
        occurredAt: z.string().datetime().optional(),
      }),
    )
    .min(1)
    .max(50),
});

/**
 * Client analytics ingestion (REQ-SYS-195/196). Best-effort: if the write fails
 * the endpoint still returns 202 so telemetry never blocks the client.
 */
analyticsRouter.post(
  "/analytics/events",
  optionalAuth,
  validate({ body: ingestSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { events } = req.body as z.infer<typeof ingestSchema>;
    const userId = req.user?.id ?? null;
    const values = events.map((e) => ({
      userId,
      eventName: e.eventName,
      clientEventId: e.clientEventId ?? null,
      articleId: e.articleId ?? null,
      props: (e.props ?? {}) as object,
      platform: e.platform ?? null,
      occurredAt: e.occurredAt ? new Date(e.occurredAt) : new Date(),
    }));
    try {
      await db.insert(analyticsEvents).values(values);
    } catch {
      /* best-effort */
    }
    return respond(res, 202, { accepted: values.length });
  }),
);
