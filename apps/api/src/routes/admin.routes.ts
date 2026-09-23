import { Router } from "express";
import { z } from "zod";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../db/client";
import { asyncHandler, respond } from "../utils/http";
import { validate } from "../middleware/validate";
import { authenticate, requireRole, requireSuperAdmin } from "../middleware/auth";
import { adminRegionService, deletionService } from "../services/admin.service";
import { auditRepo } from "../repositories/audit.repo";
import { appSettingsService } from "../services/appSettings.service";
import { articles, regions, reporterProfiles, reporterRegionScopes, users } from "../db/schema";
import { AppError } from "../errors/AppError";
import { ErrorCode } from "@newswatch/shared";

export const adminRouter: Router = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRole("admin", "super_admin"));

// ---- Region management (super admin only) ----
adminRouter.get(
  "/regions",
  asyncHandler(async (_req: Request, res: Response) => respond(res, 200, await adminRegionService.list())),
);

const regionSchema = z.object({
  type: z.enum(["state", "district", "constituency", "mandal"]),
  name: z.string().min(2).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  parentId: z.string().uuid().nullable().optional(),
});

adminRouter.post(
  "/regions",
  requireSuperAdmin(),
  validate({ body: regionSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    respond(res, 201, await adminRegionService.create(req.user!, req.body)),
  ),
);

adminRouter.patch(
  "/regions/:id",
  requireSuperAdmin(),
  validate({ body: z.object({ name: z.string().min(2).max(80).optional(), sortOrder: z.number().optional() }) }),
  asyncHandler(async (req: Request, res: Response) =>
    respond(res, 200, await adminRegionService.update(req.user!, req.params.id as string, req.body)),
  ),
);

adminRouter.delete(
  "/regions/:id",
  requireSuperAdmin(),
  asyncHandler(async (req: Request, res: Response) =>
    respond(res, 200, await adminRegionService.remove(req.user!, req.params.id as string)),
  ),
);

adminRouter.put(
  "/users/:id/region-scopes",
  requireSuperAdmin(),
  validate({ body: z.object({ regionIds: z.array(z.string().uuid()) }) }),
  asyncHandler(async (req: Request, res: Response) =>
    respond(res, 200, await adminRegionService.setAdminScopes(req.user!, req.params.id as string, req.body.regionIds)),
  ),
);

// ---- Danger zone (super admin only) ----
adminRouter.delete(
  "/users/:id",
  requireSuperAdmin(),
  asyncHandler(async (req: Request, res: Response) =>
    respond(res, 200, await deletionService.softDeleteUser(req.user!, req.params.id as string)),
  ),
);

adminRouter.post(
  "/users/:id/restore",
  requireSuperAdmin(),
  asyncHandler(async (req: Request, res: Response) =>
    respond(res, 200, await deletionService.restoreUser(req.user!, req.params.id as string)),
  ),
);

adminRouter.post(
  "/users/:id/purge",
  requireSuperAdmin(),
  asyncHandler(async (req: Request, res: Response) =>
    respond(res, 200, await deletionService.purgeUser(req.user!, req.params.id as string)),
  ),
);

adminRouter.get(
  "/users/deleted",
  requireSuperAdmin(),
  asyncHandler(async (_req: Request, res: Response) =>
    respond(res, 200, await deletionService.listSoftDeletedUsers(50)),
  ),
);

adminRouter.delete(
  "/articles/:id",
  requireSuperAdmin(),
  asyncHandler(async (req: Request, res: Response) =>
    respond(res, 200, await deletionService.hardDeleteArticle(req.user!, req.params.id as string)),
  ),
);

// ---- App settings (super admin write; public read is separate) ----
adminRouter.get(
  "/app-settings",
  requireSuperAdmin(),
  asyncHandler(async (_req: Request, res: Response) => respond(res, 200, await appSettingsService.getAll())),
);

adminRouter.put(
  "/app-settings",
  requireSuperAdmin(),
  validate({ body: z.object({ entries: z.record(z.unknown()), isPublic: z.record(z.boolean()).optional() }) }),
  asyncHandler(async (req: Request, res: Response) =>
    respond(res, 200, await appSettingsService.upsertMany(req.user!, req.body.entries, req.body.isPublic ?? {})),
  ),
);

// ---- Audit log (super admin only) ----
adminRouter.get(
  "/audit-logs",
  requireSuperAdmin(),
  validate({ query: z.object({ limit: z.coerce.number().min(1).max(100).default(50), targetType: z.string().optional() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Number((req.query as { limit?: number }).limit ?? 50);
    const targetType = (req.query as { targetType?: string }).targetType;
    return respond(res, 200, await auditRepo.list({ limit, targetType }));
  }),
);

// ---- Moderation queue (region-scoped) ----
adminRouter.get(
  "/moderation/queue",
  validate({ query: z.object({ status: z.string().default("pending"), limit: z.coerce.number().min(1).max(100).default(20) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const status = (req.query as { status?: string }).status ?? "pending";
    const limit = Number((req.query as { limit?: number }).limit ?? 20);
    const conditions = [eq(articles.status, status as never), isNull(articles.deletedAt)];
    if (req.user!.role !== "super_admin" && req.user!.regionScopes.length) {
      conditions.push(inArray(articles.regionId, req.user!.regionScopes));
    }
    const items = await db
      .select({
        id: articles.id,
        title: articles.title,
        status: articles.status,
        submittedAt: articles.submittedAt,
        reporterId: articles.reporterId,
        regionId: articles.regionId,
      })
      .from(articles)
      .where(and(...conditions))
      .orderBy(asc(articles.submittedAt))
      .limit(limit);
    return respond(res, 200, items);
  }),
);

// ---- Region tree for admin UI ----
adminRouter.get(
  "/regions/tree",
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db.select().from(regions).orderBy(asc(regions.parentId), asc(regions.sortOrder));
    return respond(res, 200, rows);
  }),
);

// ---- Users list (region-agnostic; super-admin extras guarded above) ----
adminRouter.get(
  "/users",
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.isDeleted, false))
      .orderBy(desc(users.createdAt))
      .limit(100);
    return respond(res, 200, rows);
  }),
);

// ---- Reporter applications queue (region-agnostic; approval is super/admin) ----
adminRouter.get(
  "/reporters",
  validate({ query: z.object({ status: z.string().default("pending") }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const status = (req.query as { status?: string }).status ?? "pending";
    const rows = await db
      .select({
        id: reporterProfiles.id,
        userId: reporterProfiles.userId,
        status: reporterProfiles.status,
        fullName: reporterProfiles.fullName,
        bio: reporterProfiles.bio,
        phone: reporterProfiles.phone,
        beats: reporterProfiles.beats,
        portfolioUrl: reporterProfiles.portfolioUrl,
        sampleArticleUrl: reporterProfiles.sampleArticleUrl,
        createdAt: reporterProfiles.createdAt,
        email: users.email,
      })
      .from(reporterProfiles)
      .leftJoin(users, eq(users.id, reporterProfiles.userId))
      .where(eq(reporterProfiles.status, status as never))
      .orderBy(asc(reporterProfiles.createdAt));
    return respond(res, 200, rows);
  }),
);

const approveReporterSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
  regionIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

adminRouter.post(
  "/reporters/:id/review",
  validate({ body: approveReporterSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { action, note, regionIds } = req.body as z.infer<typeof approveReporterSchema>;
    const [profile] = await db
      .select()
      .from(reporterProfiles)
      .where(eq(reporterProfiles.id, req.params.id as string))
      .limit(1);
    if (!profile) throw new AppError(ErrorCode.NOT_FOUND, 404, "Application not found");

    const [updated] = await db
      .update(reporterProfiles)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        reviewerNote: note ?? null,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
      })
      .where(eq(reporterProfiles.id, profile.id))
      .returning();

    if (action === "approve" && regionIds?.length) {
      await db.delete(reporterRegionScopes).where(eq(reporterRegionScopes.userId, profile.userId));
      await db.insert(reporterRegionScopes).values(regionIds.map((regionId) => ({ userId: profile.userId, regionId })));
    }
    await auditRepo.record({
      actorId: req.user!.id,
      action: `reporter.${action}`,
      targetType: "reporter",
      targetId: profile.userId,
      meta: { note: note ?? null, regionIds: regionIds ?? [] },
    });
    return respond(res, 200, updated);
  }),
);

// ---- Analytics summary (region-scoped) ----
adminRouter.get(
  "/analytics/summary",
  asyncHandler(async (req: Request, res: Response) => {
    const scoped = req.user!.role !== "super_admin" && req.user!.regionScopes.length > 0;
    const base = [eq(articles.status, "published"), isNull(articles.deletedAt)];
    if (scoped) base.push(inArray(articles.regionId, req.user!.regionScopes));

    const rows = await db
      .select({
        published: sql<number>`count(*)::int`,
        views: sql<number>`coalesce(sum(${articles.viewCount}),0)::int`,
        likes: sql<number>`coalesce(sum(${articles.likeCount}),0)::int`,
        comments: sql<number>`coalesce(sum(${articles.commentCount}),0)::int`,
        bookmarks: sql<number>`coalesce(sum(${articles.bookmarkCount}),0)::int`,
      })
      .from(articles)
      .where(and(...base));

    const topArticles = await db
      .select({ id: articles.id, title: articles.title, views: articles.viewCount })
      .from(articles)
      .where(and(...base))
      .orderBy(desc(articles.viewCount))
      .limit(5);

    return respond(res, 200, { totals: rows[0] ?? null, topArticles });
  }),
);
