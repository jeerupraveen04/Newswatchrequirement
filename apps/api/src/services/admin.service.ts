import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { ErrorCode } from "@newswatch/shared";
import { AppError } from "../errors/AppError";
import { auditRepo } from "../repositories/audit.repo";
import { adminRegionScopes, articles, regions, users } from "../db/schema";
import type { Principal } from "../middleware/auth";

/** Region management (super admin only — REQ-REG-005/006/007). */
export const adminRegionService = {
  list: () => db.select().from(regions).orderBy(regions.parentId, regions.sortOrder),

  async create(
    principal: Principal,
    input: { type: "state" | "district" | "constituency" | "mandal"; name: string; slug: string; parentId?: string | null },
  ) {
    const [region] = await db
      .insert(regions)
      .values({ type: input.type, name: input.name, slug: input.slug, parentId: input.parentId ?? null })
      .returning();
    await auditRepo.record({ actorId: principal.id, action: "region.create", targetType: "region", targetId: region!.id });
    return region;
  },

  async update(principal: Principal, id: string, input: { name?: string; sortOrder?: number }) {
    const [region] = await db.update(regions).set(input).where(eq(regions.id, id)).returning();
    await auditRepo.record({ actorId: principal.id, action: "region.update", targetType: "region", targetId: id, meta: input });
    return region;
  },

  async remove(principal: Principal, id: string) {
    const childRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(regions)
      .where(eq(regions.parentId, id));
    if ((childRows[0]?.count ?? 0) > 0) throw new AppError(ErrorCode.REGION_HAS_CHILDREN, 409);
    const articleRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles)
      .where(eq(articles.regionId, id));
    if ((articleRows[0]?.count ?? 0) > 0) throw new AppError(ErrorCode.REGION_HAS_ARTICLES, 409);
    await db.delete(regions).where(eq(regions.id, id));
    await auditRepo.record({ actorId: principal.id, action: "region.delete", targetType: "region", targetId: id });
    return { deleted: true };
  },

  async setAdminScopes(principal: Principal, userId: string, regionIds: string[]) {
    await db.transaction(async (tx) => {
      await tx.delete(adminRegionScopes).where(eq(adminRegionScopes.userId, userId));
      if (regionIds.length) {
        await tx.insert(adminRegionScopes).values(regionIds.map((regionId) => ({ userId, regionId })));
      }
    });
    await auditRepo.record({
      actorId: principal.id,
      action: "admin.scopes.set",
      targetType: "user",
      targetId: userId,
      meta: { regionIds },
    });
    return { regionIds };
  },
};

/** Danger zone (super admin only — REQ-DEL-001..007). */
export const deletionService = {
  async softDeleteUser(principal: Principal, userId: string) {
    if (userId === principal.id) throw new AppError(ErrorCode.VALIDATION_ERROR, 422, "Cannot delete yourself");
    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) throw new AppError(ErrorCode.USER_NOT_FOUND, 404);
    if (target.role === "super_admin") {
      const superRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(eq(users.role, "super_admin"), eq(users.isDeleted, false)));
      if ((superRows[0]?.count ?? 0) <= 1) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 422, "Cannot delete the last super admin");
      }
    }
    const [user] = await db
      .update(users)
      .set({ isDeleted: true, deletedAt: new Date(), deletedBy: principal.id, status: "deleted" })
      .where(eq(users.id, userId))
      .returning();
    await auditRepo.record({ actorId: principal.id, action: "user.soft_delete", targetType: "user", targetId: userId });
    return { id: user!.id, isDeleted: user!.isDeleted };
  },

  async restoreUser(principal: Principal, userId: string) {
    const [user] = await db
      .update(users)
      .set({ isDeleted: false, deletedAt: null, deletedBy: null, restoredAt: new Date(), status: "active" })
      .where(eq(users.id, userId))
      .returning();
    await auditRepo.record({ actorId: principal.id, action: "user.restore", targetType: "user", targetId: userId });
    return { id: user!.id, isDeleted: user!.isDeleted };
  },

  async purgeUser(principal: Principal, userId: string) {
    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) throw new AppError(ErrorCode.USER_NOT_FOUND, 404);
    if (!target.isDeleted) throw new AppError(ErrorCode.VALIDATION_ERROR, 422, "Purge requires a soft-deleted user");
    await db.delete(users).where(eq(users.id, userId));
    await auditRepo.record({ actorId: principal.id, action: "user.purge", targetType: "user", targetId: userId });
    return { purged: true };
  },

  async hardDeleteArticle(principal: Principal, articleId: string) {
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
    if (!article) throw new AppError(ErrorCode.ARTICLE_NOT_FOUND, 404);
    await db.delete(articles).where(eq(articles.id, articleId));
    await auditRepo.record({
      actorId: principal.id,
      action: "article.hard_delete",
      targetType: "article",
      targetId: articleId,
      meta: { slug: article.slug, title: article.title },
    });
    return { purged: true };
  },

  listSoftDeletedUsers: (limit: number) =>
    db.select().from(users).where(eq(users.isDeleted, true)).orderBy(desc(users.deletedAt)).limit(limit),
};

