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
import { articleService } from "../services/article.service";

export const reporterRouter: Router = Router();

reporterRouter.use(authenticate);

const reporterOnly = requireRole("reporter", "admin", "super_admin");
const articleStatuses = ["draft", "pending", "published", "rejected", "unpublished"] as const;

/** The reporter's own articles, optional status filter. */
reporterRouter.get(
  "/articles",
  reporterOnly,
  validate({ query: z.object({ status: z.enum(articleStatuses).optional() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const status = (req.query as { status?: string }).status;
    const conditions = [eq(articles.reporterId, req.user!.id), eq(articles.isDeleted, false)];
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
        likeCount: articles.likeCount,
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

const createSchema = z.object({
  title: z.string().min(5).max(140),
  summary: z.string().min(1).max(300),
  body: z.string().min(1),
  bodyFormat: z.enum(["rich", "markdown"]).default("rich"),
  regionId: z.string().uuid(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  headlineStyle: z.unknown().optional(),
  descriptionStyle: z.unknown().optional(),
  poster: z.unknown().optional(),
});

/** Create a draft article (R02). Approved reporters only. */
reporterRouter.post(
  "/articles",
  reporterOnly,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user!.isApprovedReporter) {
      const { AppError } = await import("../errors/AppError");
      const { ErrorCode } = await import("@newswatch/shared");
      throw new AppError(ErrorCode.REPORTER_NOT_APPROVED, 403);
    }
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      const { AppError } = await import("../errors/AppError");
      const { ErrorCode } = await import("@newswatch/shared");
      throw new AppError(ErrorCode.VALIDATION_ERROR, 422, "Invalid article", parsed.error.flatten().fieldErrors as Record<string, string>);
    }
    return respond(res, 201, await articleService.createDraft(req.user!, parsed.data));
  }),
);

/** Aggregate counts per status for R03 filter pills. */
reporterRouter.get(
  "/counts",
  reporterOnly,
  asyncHandler(async (req: Request, res: Response) => {
    const { articleRepo } = await import("../repositories/article.repo");
    return respond(res, 200, await articleRepo.countsForReporter(req.user!.id));
  }),
);

/** Dashboard stats for R01. */
reporterRouter.get(
  "/stats",
  reporterOnly,
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await articleService.reporterStats(req.user!));
  }),
);

/** Full article for the composer (any status owned by the caller). */
reporterRouter.get(
  "/articles/:id",
  reporterOnly,
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await articleService.getForEdit(req.user!, req.params.id as string));
  }),
);

const updateSchema = z.object({
  title: z.string().min(5).max(140).optional(),
  summary: z.string().min(1).max(300).optional(),
  body: z.string().min(1).optional(),
  bodyFormat: z.enum(["rich", "markdown"]).optional(),
  regionId: z.string().uuid().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  headlineStyle: z.unknown().optional(),
  descriptionStyle: z.unknown().optional(),
  poster: z.unknown().optional(),
  media: z
    .array(z.object({ assetId: z.string().uuid(), isHero: z.boolean(), alt: z.string().max(300).nullable().optional() }))
    .optional(),
});

/** Update an existing draft/rejected article (R02 edit mode). */
reporterRouter.patch(
  "/articles/:id",
  reporterOnly,
  validate({ body: updateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await articleService.updateDraft(req.user!, req.params.id as string, req.body));
  }),
);

/** Delete own draft/rejected article. */
reporterRouter.delete(
  "/articles/:id",
  reporterOnly,
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await articleService.removeDraft(req.user!, req.params.id as string));
  }),
);

/** Submit own article for review. */
reporterRouter.post(
  "/articles/:id/submit",
  reporterOnly,
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await articleService.submit(req.user!, req.params.id as string));
  }),
);

/** Reporter's assigned regions (cascade roots) — REQ-REG-002. */
reporterRouter.get(
  "/regions",
  reporterOnly,
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
  reporterOnly,
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

