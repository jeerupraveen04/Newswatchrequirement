import { and, desc, eq, isNull, sql, lt, or, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { articles, articleCategories, articleImages, mediaAssets, regions, tags, articleTags, users, categories } from "../db/schema";
import { decodeCursor, encodeCursor } from "@newswatch/shared";

export interface ListPublishedArgs {
  cursor?: string;
  limit: number;
  categoryId?: string;
  regionId?: string;
  isBreaking?: boolean;
}

async function hydrateArticles(rows: Array<typeof articles.$inferSelect>) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const reporterIds = [...new Set(rows.map((r) => r.reporterId))];
  const regionIds = [...new Set(rows.map((r) => r.regionId))];

  const [reporters, regionRows, catRows, imageRows] = await Promise.all([
    reporterIds.length
      ? db
          .select({ id: users.id, displayName: users.displayName, username: users.username, avatarUrl: users.avatarUrl, role: users.role })
          .from(users)
          .where(inArray(users.id, reporterIds))
      : Promise.resolve([]),
    regionIds.length
      ? db
          .select({ id: regions.id, name: regions.name, type: regions.type })
          .from(regions)
          .where(inArray(regions.id, regionIds))
      : Promise.resolve([]),
    db
      .select({ articleId: articleCategories.articleId, category: categories })
      .from(articleCategories)
      .innerJoin(categories, eq(categories.id, articleCategories.categoryId))
      .where(inArray(articleCategories.articleId, ids)),
    db
      .select({ image: articleImages, asset: mediaAssets })
      .from(articleImages)
      .innerJoin(mediaAssets, eq(mediaAssets.id, articleImages.mediaAssetId))
      .where(inArray(articleImages.articleId, ids))
      .orderBy(articleImages.position),
  ]);

  const reporterMap = new Map(reporters.map((r) => [r.id, r]));
  const regionMap = new Map(regionRows.map((r) => [r.id, r]));
  const catMap = new Map<string, Array<typeof categories.$inferSelect>>();
  for (const row of catRows) {
    const list = catMap.get(row.articleId) ?? [];
    list.push(row.category);
    catMap.set(row.articleId, list);
  }
  const imageMap = new Map<string, Array<{ image: typeof articleImages.$inferSelect; asset: typeof mediaAssets.$inferSelect }>>();
  for (const row of imageRows) {
    const list = imageMap.get(row.image.articleId) ?? [];
    list.push(row);
    imageMap.set(row.image.articleId, list);
  }

  return rows.map((a) => ({
    ...a,
    reporter: reporterMap.get(a.reporterId) ?? null,
    region: regionMap.get(a.regionId) ?? null,
    categories: (catMap.get(a.id) ?? []).map((category) => ({ category })),
    images: imageMap.get(a.id) ?? [],
  }));
}

export type HydratedArticle = Awaited<ReturnType<typeof hydrateArticles>>[number];

export const articleRepo = {
  async listPublished(args: ListPublishedArgs) {
    const conditions = [eq(articles.status, "published"), isNull(articles.deletedAt)];
    if (args.isBreaking) conditions.push(eq(articles.isBreaking, true));
    if (args.regionId) conditions.push(eq(articles.regionId, args.regionId));

    if (args.cursor) {
      const c = decodeCursor<{ publishedAt: string; id: string }>(args.cursor);
      conditions.push(
        or(
          lt(articles.publishedAt, new Date(c.publishedAt)),
          and(eq(articles.publishedAt, new Date(c.publishedAt)), lt(articles.id, c.id)),
        )!,
      );
    }

    // Category filter must be part of the query (not applied after LIMIT),
    // otherwise pagination/cursor/hasMore are wrong.
    if (args.categoryId) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${articleCategories} ac WHERE ac.article_id = ${articles.id} AND ac.category_id = ${args.categoryId})`,
      );
    }

    const rows = await db
      .select()
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt), desc(articles.id))
      .limit(args.limit + 1);

    const hasMore = rows.length > args.limit;
    const items = rows.slice(0, args.limit);
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor({ publishedAt: last.publishedAt!.toISOString(), id: last.id }) : null;

    return { items: await hydrateArticles(items), nextCursor, hasMore };
  },

  async findBySlug(slug: string) {
    const [row] = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.status, "published"), isNull(articles.deletedAt)))
      .limit(1);
    if (!row) return null;
    const [hydrated] = await hydrateArticles([row]);
    const tagRows = await db
      .select({ name: tags.name })
      .from(articleTags)
      .innerJoin(tags, eq(tags.id, articleTags.tagId))
      .where(eq(articleTags.articleId, row.id));
    return { ...hydrated!, tags: tagRows.map((t) => ({ tag: { name: t.name } })) };
  },

  async findById(id: string) {
    const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!row) return null;
    const [hydrated] = await hydrateArticles([row]);
    return hydrated!;
  },

  /** Any article regardless of status, including the body and tags (for edit). */
  async findByIdWithBody(id: string) {
    const row = await this.findById(id);
    if (!row) return null;
    const tagRows = await db
      .select({ name: tags.name })
      .from(articleTags)
      .innerJoin(tags, eq(tags.id, articleTags.tagId))
      .where(eq(articleTags.articleId, id));
    return { ...row, tags: tagRows.map((t) => t.name) };
  },

  async update(
    id: string,
    patch: Partial<{
      title: string;
      summary: string;
      body: string;
      bodyFormat: "rich" | "markdown";
      regionId: string;
      headlineStyle: unknown;
      descriptionStyle: unknown;
      poster: unknown;
      readingMinutes: number;
    }>,
  ) {
    await db
      .update(articles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(articles.id, id));
  },

  async softDelete(id: string) {
    await db
      .update(articles)
      .set({ isDeleted: true, deletedAt: new Date(), status: "deleted" })
      .where(eq(articles.id, id));
  },

  /** Replace the image set for an article (hero + gallery). */
  async replaceMedia(articleId: string, items: Array<{ assetId: string; isHero: boolean; alt?: string | null }>) {
    await db.delete(articleImages).where(eq(articleImages.articleId, articleId));
    if (items.length) {
      await db.insert(articleImages).values(
        items.map((m, i) => ({
          articleId,
          mediaAssetId: m.assetId,
          position: i,
          isHero: m.isHero,
          alt: m.alt ?? null,
        })),
      );
    }
    const hero = items.find((m) => m.isHero) ?? items[0];
    await db.update(articles).set({ heroImageId: hero?.assetId ?? null }).where(eq(articles.id, articleId));
  },

  async replaceCategories(articleId: string, categoryIds: string[]) {
    await db.delete(articleCategories).where(eq(articleCategories.articleId, articleId));
    if (categoryIds.length) {
      await db
        .insert(articleCategories)
        .values(categoryIds.map((categoryId, i) => ({ articleId, categoryId, isPrimary: i === 0 })));
    }
  },

  async replaceTags(articleId: string, names: string[]) {
    await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
    for (const name of names.slice(0, 10)) {
      const slug = (await import("../utils/text")).slugify(name);
      if (!slug) continue;
      const [existing] = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
      const tag = existing ?? (await db.insert(tags).values({ name, slug }).returning())[0]!;
      await db.insert(articleTags).values({ articleId, tagId: tag.id });
    }
  },

  async statsForReporter(reporterId: string) {
    const rows = await db
      .select({
        status: articles.status,
        count: sql<number>`count(*)::int`,
        views: sql<number>`coalesce(sum(${articles.viewCount}), 0)::int`,
        likes: sql<number>`coalesce(sum(${articles.likeCount}), 0)::int`,
      })
      .from(articles)
      .where(and(eq(articles.reporterId, reporterId), eq(articles.isDeleted, false)))
      .groupBy(articles.status);
    return rows;
  },

  async countsForReporter(reporterId: string) {
    const rows = await db
      .select({ status: articles.status, count: sql<number>`count(*)::int` })
      .from(articles)
      .where(and(eq(articles.reporterId, reporterId), eq(articles.isDeleted, false)))
      .groupBy(articles.status);
    const counts: Record<string, number> = { all: 0 };
    for (const r of rows) {
      counts[r.status] = r.count;
      counts.all = (counts.all ?? 0) + r.count;
    }
    return counts;
  },

  async incrementView(id: string) {
    await db
      .update(articles)
      .set({ viewCount: sql`${articles.viewCount} + 1` })
      .where(eq(articles.id, id));
  },

  async addStatusHistory(input: {
    articleId: string;
    fromStatus: typeof articles.$inferInsert.status | null;
    toStatus: NonNullable<typeof articles.$inferInsert.status>;
    changedBy?: string | null;
    note?: string | null;
  }) {
    const { articleStatusHistory } = await import("../db/schema");
    await db.insert(articleStatusHistory).values({
      articleId: input.articleId,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus,
      changedBy: input.changedBy ?? null,
      note: input.note ?? null,
    });
  },

  async listForReporter(reporterId: string, status?: string) {
    const conditions = [eq(articles.reporterId, reporterId)];
    if (status) conditions.push(eq(articles.status, status as never));
    const rows = await db.select().from(articles).where(and(...conditions)).orderBy(desc(articles.updatedAt));
    return hydrateArticles(rows);
  },

  async listForAdmin(params: { regionIds: string[] | null; status?: string; limit: number }) {
    const conditions = [isNull(articles.deletedAt)];
    if (params.status) conditions.push(eq(articles.status, params.status as never));
    if (params.regionIds && params.regionIds.length) {
      conditions.push(inArray(articles.regionId, params.regionIds));
    }
    const rows = await db
      .select()
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.updatedAt))
      .limit(params.limit);
    return hydrateArticles(rows);
  },

  async search(q: string, limit: number) {
    const rows = await db.execute<{
      id: string;
      slug: string;
      title: string;
      summary: string;
      published_at: Date;
    }>(sql`
      SELECT id, slug, title, summary, published_at
      FROM articles
      WHERE status = 'published' AND deleted_at IS NULL
        AND search_vector @@ websearch_to_tsquery('english', ${q})
      ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', ${q})) DESC,
               published_at DESC
      LIMIT ${limit};
    `);
    return rows as unknown as Array<{ id: string; slug: string; title: string; summary: string; published_at: Date }>;
  },
};

void articleImages;
