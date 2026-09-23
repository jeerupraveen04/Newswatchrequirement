import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { adminRegionScopes, regions, reporterRegionScopes } from "../db/schema";

/** Region scope lookups for region-scoped authorization (REQ-REG-003/004). */

export const regionRepo = {
  async findById(id: string) {
    const [row] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);
    return row ?? null;
  },

  async children(parentId: string) {
    return db.select().from(regions).where(eq(regions.parentId, parentId)).orderBy(regions.sortOrder);
  },

  async findBySlug(slug: string) {
    const [row] = await db.select().from(regions).where(eq(regions.slug, slug)).limit(1);
    return row ?? null;
  },

  /**
   * Expand an actor's directly-assigned region ids to include all descendants.
   * Iterative breadth-first expansion (tree depth is 4), avoids raw array binds.
   */
  async expandScope(seedRegionIds: string[]): Promise<Set<string>> {
    if (seedRegionIds.length === 0) return new Set();
    const all = new Set<string>(seedRegionIds);
    let frontier = [...seedRegionIds];
    while (frontier.length) {
      const children = await db
        .select({ id: regions.id })
        .from(regions)
        .where(inArray(regions.parentId, frontier));
      const next: string[] = [];
      for (const c of children) {
        if (!all.has(c.id)) {
          all.add(c.id);
          next.push(c.id);
        }
      }
      frontier = next;
    }
    return all;
  },

  async adminScopeRegionIds(userId: string): Promise<string[]> {
    const rows = await db
      .select({ regionId: adminRegionScopes.regionId })
      .from(adminRegionScopes)
      .where(eq(adminRegionScopes.userId, userId));
    return rows.map((r) => r.regionId);
  },

  async reporterScopeRegionIds(userId: string): Promise<string[]> {
    const rows = await db
      .select({ regionId: reporterRegionScopes.regionId })
      .from(reporterRegionScopes)
      .where(eq(reporterRegionScopes.userId, userId));
    return rows.map((r) => r.regionId);
  },

  async isInScope(scopeRegionIds: string[], candidateRegionId: string): Promise<boolean> {
    if (scopeRegionIds.length === 0) return false;
    const set = await this.expandScope(scopeRegionIds);
    return set.has(candidateRegionId);
  },

  async listAll() {
    return db.select().from(regions).orderBy(regions.parentId, regions.sortOrder);
  },

  async listByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return db.select().from(regions).where(inArray(regions.id, ids));
  },
};
