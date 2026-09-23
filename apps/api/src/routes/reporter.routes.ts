import { Router } from "express";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../db/client";
import { articles, reporterProfiles, users } from "../db/schema";
import { asyncHandler, respond } from "../utils/http";
import { validate } from "../middleware/validate";
import { authenticate, requireRole } from "../middleware/auth";
import { regionRepo } from "../repositories/region.repo";

export const reporterRouter: Router = Router();

reporterRouter.use(authenticate);
reporterRouter.use(requireRole("reporter", "admin", "super_admin"));

/** The reporter's own articles, optional status filter. */
reporterRouter.get(
  "/articles",
  validate({ query: z.object({ status: z.string().optional() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const status = (req.query as { status?: string }).status;
    const conditions = [eq(articles.reporterId, req.user!.id)];
    if (status) conditions.push(eq(articles.status, status as never));
    const rows = await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        summary: articles.summary,
        status: articles.status,
        regionId: articles.regionId,
        viewCount: articles.viewCount,
        reviewNote: articles.reviewNote,
        submittedAt: articles.submittedAt,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.updatedAt));
    return respond(res, 200, rows);
  }),
);

/** Reporter's assigned regions (cascade roots) — REQ-REG-002. */
reporterRouter.get(
  "/regions",
  asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.role === "super_admin") {
      const all = await regionRepo.listAll();
      return respond(res, 200, all);
    }
    const ids = req.user!.regionScopes.filter((r) => r !== "*");
    const rows = ids.length ? await regionRepo.listByIds(ids) : [];
    return respond(res, 200, rows);
  }),
);

/** Reporter profile / approval status. */
reporterRouter.get(
  "/profile",
  asyncHandler(async (req: Request, res: Response) => {
    const [profile] = await db
      .select()
      .from(reporterProfiles)
      .where(eq(reporterProfiles.userId, req.user!.id))
      .limit(1);
    return respond(res, 200, profile ?? null);
  }),
);

const applySchema = z.object({
  fullName: z.string().min(2).max(120),
  bio: z.string().min(10).max(2000),
  phone: z.string().min(6).max(20),
  beats: z.array(z.string().min(1).max(40)).max(10).default([]),
  portfolioUrl: z.string().url().optional(),
  sampleArticleUrl: z.string().url().optional(),
  requestedRegionIds: z.array(z.string().uuid()).max(20).optional(),
});

/** Apply to become a reporter (R04). */
reporterRouter.post(
  "/apply",
  validate({ body: applySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const [existing] = await db
      .select()
      .from(reporterProfiles)
      .where(eq(reporterProfiles.userId, req.user!.id))
      .limit(1);
    if (existing && existing.status === "approved") {
      return respond(res, 409, existing);
    }
    const payload = {
      userId: req.user!.id,
      status: "pending" as const,
      fullName: req.body.fullName,
      bio: req.body.bio,
      phone: req.body.phone,
      beats: req.body.beats,
      portfolioUrl: req.body.portfolioUrl ?? null,
      sampleArticleUrl: req.body.sampleArticleUrl ?? null,
    };
    const profile = existing
      ? (await db.update(reporterProfiles).set(payload).where(eq(reporterProfiles.userId, req.user!.id)).returning())[0]
      : (await db.insert(reporterProfiles).values(payload).returning())[0];
    // Ensure the user has the reporter role (they can draft but not submit until approved).
    await db.update(users).set({ role: "reporter" }).where(eq(users.id, req.user!.id));
    return respond(res, 201, profile);
  }),
);

