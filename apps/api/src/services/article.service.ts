import sanitizeHtml from "sanitize-html";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { ErrorCode } from "@newswatch/shared";
import { AppError } from "../errors/AppError";
import { articleRepo, type HydratedArticle } from "../repositories/article.repo";
import { regionRepo } from "../repositories/region.repo";
import { auditRepo } from "../repositories/audit.repo";
import { articleCategories, articleTags, articles, tags } from "../db/schema";
import { readingMinutes, slugify, wordCount } from "../utils/text";
import { actorInScope, type Principal } from "../middleware/auth";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "del",
    "h2", "h3", "blockquote", "ul", "ol", "li", "a", "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    span: ["style"],
    p: ["style"],
  },
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb/],
      "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb/],
      "font-size": [/^\d{1,3}px$/],
      "font-weight": [/^\d{3}$/],
      "text-decoration": [/^[a-z-]+$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

function toArticleCard(a: HydratedArticle) {
  const hero =
    a.images.find((i) => i.image.isHero) ??
    (a.heroImageId ? a.images.find((i) => i.asset.id === a.heroImageId) : undefined);
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    headlineStyle: a.headlineStyle,
    descriptionStyle: a.descriptionStyle,
    status: a.status,
    isBreaking: a.isBreaking,
    viewCount: a.viewCount,
    likeCount: a.likeCount,
    commentCount: a.commentCount,
    bookmarkCount: a.bookmarkCount,
    readingMinutes: a.readingMinutes,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    reporter: a.reporter,
    region: a.region,
    categories: a.categories.map((c) => c.category),
    heroMedia: hero
      ? {
          id: hero.asset.id,
          kind: hero.asset.kind,
          url: hero.asset.url,
          posterUrl: null,
          width: hero.asset.width,
          height: hero.asset.height,
          durationSeconds: hero.asset.durationSeconds,
          alt: hero.image.alt,
        }
      : null,
    media: a.images.map((i) => ({
      id: i.asset.id,
      kind: i.asset.kind,
      url: i.asset.url,
      width: i.asset.width,
      height: i.asset.height,
      durationSeconds: i.asset.durationSeconds,
      alt: i.image.alt,
      position: i.image.position,
      isHero: i.image.isHero,
    })),
  };
}

export const articleService = {
  async getFeed(args: { cursor?: string; limit: number; categoryId?: string; regionId?: string }) {
    const { items, nextCursor, hasMore } = await articleRepo.listPublished(args);
    return { items: items.map(toArticleCard), meta: { nextCursor, hasMore, limit: args.limit } };
  },

  async getBreaking(limit: number) {
    const { items } = await articleRepo.listPublished({ limit, isBreaking: true });
    return items.map(toArticleCard);
  },

  async getBySlug(slug: string, _principal: Principal | null) {
    const article = await articleRepo.findBySlug(slug);
    if (!article) throw new AppError(ErrorCode.ARTICLE_NOT_FOUND, 404);
    await articleRepo.incrementView(article.id);
    return {
      ...toArticleCard(article),
      body: article.body,
      bodyFormat: article.bodyFormat,
      tags: article.tags.map((t) => t.tag.name),
    };
  },

  async search(q: string, limit: number) {
    const rows = await articleRepo.search(q, limit);
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      publishedAt: r.published_at,
    }));
  },

  async createDraft(
    principal: Principal,
    input: {
      title: string;
      summary: string;
      body: string;
      bodyFormat?: "rich" | "markdown";
      regionId: string;
      categoryIds?: string[];
      tags?: string[];
      headlineStyle?: unknown;
      descriptionStyle?: unknown;
      poster?: unknown;
    },
  ) {
    if (!actorInScope(principal, input.regionId)) throw new AppError(ErrorCode.OUT_OF_SCOPE, 403);
    const region = await regionRepo.findById(input.regionId);
    if (!region) throw new AppError(ErrorCode.INVALID_REFERENCE, 400, "Region not found");

    const body = sanitizeRichText(input.body);
    const slug = await this.uniqueSlug(input.title);

    const article = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(articles)
        .values({
          slug,
          title: input.title,
          summary: input.summary,
          body,
          bodyFormat: input.bodyFormat ?? "rich",
          headlineStyle: (input.headlineStyle ?? null) as object,
          descriptionStyle: (input.descriptionStyle ?? null) as object,
          poster: (input.poster ?? null) as object,
          reporterId: principal.id,
          regionId: input.regionId,
          status: "draft",
          readingMinutes: readingMinutes(body),
        })
        .returning();
      if (input.categoryIds?.length && row) {
        await tx.insert(articleCategories).values(
          input.categoryIds.map((categoryId, i) => ({ articleId: row.id, categoryId, isPrimary: i === 0 })),
        );
      }
      return row!;
    });

    if (input.tags?.length) await this.upsertTags(article.id, input.tags);
    return toArticleCard((await articleRepo.findById(article.id))!);
  },

  async submit(principal: Principal, articleId: string) {
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
    if (!article) throw new AppError(ErrorCode.ARTICLE_NOT_FOUND, 404);
    if (article.reporterId !== principal.id) throw new AppError(ErrorCode.FORBIDDEN, 403);
    if (!actorInScope(principal, article.regionId)) throw new AppError(ErrorCode.OUT_OF_SCOPE, 403);
    if (!["draft", "rejected"].includes(article.status)) {
      throw new AppError(ErrorCode.INVALID_STATUS_TRANSITION, 409);
    }
    if (wordCount(article.body) < 200) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 422, "Article body must be at least 200 words", {
        body: "min_words_200",
      });
    }
    await db.update(articles).set({ status: "pending", submittedAt: new Date() }).where(eq(articles.id, articleId));
    await articleRepo.addStatusHistory({
      articleId,
      fromStatus: article.status,
      toStatus: "pending",
      changedBy: principal.id,
    });
    return toArticleCard((await articleRepo.findById(articleId))!);
  },

  async moderate(
    principal: Principal,
    articleId: string,
    action: "publish" | "reject" | "unpublish",
    note?: string,
  ) {
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
    if (!article) throw new AppError(ErrorCode.ARTICLE_NOT_FOUND, 404);
    if (!actorInScope(principal, article.regionId)) throw new AppError(ErrorCode.OUT_OF_SCOPE, 403);

    const to = action === "publish" ? "published" : action === "reject" ? "rejected" : "unpublished";
    if (action === "reject" && !note) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 422, "Rejection reason is required", { note: "required" });
    }

    await db
      .update(articles)
      .set({
        status: to,
        reviewNote: note ?? null,
        reviewedBy: principal.id,
        publishedAt: action === "publish" ? new Date() : article.publishedAt,
      })
      .where(eq(articles.id, articleId));
    await articleRepo.addStatusHistory({
      articleId,
      fromStatus: article.status,
      toStatus: to,
      changedBy: principal.id,
      note: note ?? null,
    });
    await auditRepo.record({
      actorId: principal.id,
      action: `article.${action}`,
      targetType: "article",
      targetId: articleId,
      meta: { note: note ?? null },
    });
    return toArticleCard((await articleRepo.findById(articleId))!);
  },

  async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let candidate = base || "article";
    let i = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const [exists] = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, candidate)).limit(1);
      if (!exists) return candidate;
      i += 1;
      candidate = `${base}-${i}`;
    }
  },

  async upsertTags(articleId: string, names: string[]) {
    for (const name of names.slice(0, 10)) {
      const slug = slugify(name);
      if (!slug) continue;
      const [existing] = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
      const tag = existing ?? (await db.insert(tags).values({ name, slug }).returning())[0]!;
      const [link] = await db
        .select()
        .from(articleTags)
        .where(and(eq(articleTags.articleId, articleId), eq(articleTags.tagId, tag.id)))
        .limit(1);
      if (!link) await db.insert(articleTags).values({ articleId, tagId: tag.id });
    }
  },
};

