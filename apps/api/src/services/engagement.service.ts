import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db/client";
import { ErrorCode } from "@newswatch/shared";
import { AppError } from "../errors/AppError";
import {
  articles,
  bookmarks,
  categories,
  comments,
  follows,
  notifications,
  reactions,
  users,
} from "../db/schema";
import type { Principal } from "../middleware/auth";
import { realtime } from "../realtime/io";

const authorSelect = {
  id: users.id,
  displayName: users.displayName,
  username: users.username,
  avatarUrl: users.avatarUrl,
  role: users.role,
};

/** Comments with max depth 2, counters in-transaction (REQ-SYS-420/422). */
export const commentService = {
  async list(articleId: string, params: { cursor?: string; limit: number }) {
    const rows = await db
      .select()
      .from(comments)
      .where(and(eq(comments.articleId, articleId), isNull(comments.deletedAt), eq(comments.isHidden, false), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt))
      .limit(params.limit + 1);

    const parentIds = rows.map((r) => r.id);
    const replies = parentIds.length
      ? await db
          .select()
          .from(comments)
          .where(and(sql`${comments.parentId} = ANY(${parentIds}::uuid[])`, isNull(comments.deletedAt), eq(comments.isHidden, false)))
          .orderBy(comments.createdAt)
      : [];

    // Attach authors.
    const authorIds = [...new Set([...rows, ...replies].map((c) => c.authorId))];
    const authors = authorIds.length
      ? await db.select(authorSelect).from(users).where(sql`${users.id} = ANY(${authorIds}::uuid[])`)
      : [];
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    return rows.map((r) => ({
      ...r,
      author: authorMap.get(r.authorId) ?? null,
      replies: replies.filter((x) => x.parentId === r.id).map((x) => ({ ...x, author: authorMap.get(x.authorId) ?? null })),
    }));
  },

  async create(principal: Principal, articleId: string, body: string, parentId?: string) {
    const [article] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(and(eq(articles.id, articleId), eq(articles.status, "published")))
      .limit(1);
    if (!article) throw new AppError(ErrorCode.ARTICLE_NOT_FOUND, 404);

    let depth = 0;
    if (parentId) {
      const [parent] = await db.select().from(comments).where(eq(comments.id, parentId)).limit(1);
      if (!parent || parent.articleId !== articleId) throw new AppError(ErrorCode.INVALID_REFERENCE, 400);
      depth = parent.depth + 1;
      if (depth > 2) throw new AppError(ErrorCode.VALIDATION_ERROR, 422, "Max reply depth exceeded", { parentId: "too_deep" });
    }

    return db.transaction(async (tx) => {
      const [comment] = await tx
        .insert(comments)
        .values({ articleId, authorId: principal.id, parentId: parentId ?? null, depth, body })
        .returning();
      await tx
        .update(articles)
        .set({ commentCount: sql`${articles.commentCount} + 1` })
        .where(eq(articles.id, articleId));
      if (parentId) {
        await tx
          .update(comments)
          .set({ replyCount: sql`${comments.replyCount} + 1` })
          .where(eq(comments.id, parentId));
      }
      return comment!;
    }).then((comment) => {
      realtime.commentNew(articleId, comment);
      return comment;
    });
  },

  async update(principal: Principal, commentId: string, body: string) {
    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    if (!comment) throw new AppError(ErrorCode.NOT_FOUND, 404);
    if (comment.authorId !== principal.id && principal.role !== "super_admin") {
      throw new AppError(ErrorCode.FORBIDDEN, 403);
    }
    const [updated] = await db.update(comments).set({ body }).where(eq(comments.id, commentId)).returning();
    return updated;
  },

  async remove(principal: Principal, commentId: string) {
    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    if (!comment) throw new AppError(ErrorCode.NOT_FOUND, 404);
    const canModerate = ["admin", "super_admin"].includes(principal.role);
    if (comment.authorId !== principal.id && !canModerate) throw new AppError(ErrorCode.FORBIDDEN, 403);
    await db.transaction(async (tx) => {
      await tx.update(comments).set({ deletedAt: new Date(), isHidden: true }).where(eq(comments.id, commentId));
      await tx
        .update(articles)
        .set({ commentCount: sql`GREATEST(${articles.commentCount} - 1, 0)` })
        .where(eq(articles.id, comment.articleId));
      if (comment.parentId) {
        await tx
          .update(comments)
          .set({ replyCount: sql`GREATEST(${comments.replyCount} - 1, 0)` })
          .where(eq(comments.id, comment.parentId));
      }
    });
    return { removed: true };
  },
};

/** Likes via reactions with idempotent toggle (REQ-SYS-423). */
export const reactionService = {
  async toggle(principal: Principal, targetType: "article" | "comment", targetId: string) {
    const [existing] = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.userId, principal.id),
          eq(reactions.targetType, targetType),
          eq(reactions.targetId, targetId),
          eq(reactions.type, "like"),
        ),
      )
      .limit(1);

    return db.transaction(async (tx) => {
      if (existing) {
        await tx.delete(reactions).where(eq(reactions.id, existing.id));
        await this.applyCounter(tx, targetType, targetId, -1);
        return { liked: false };
      }
      await tx.insert(reactions).values({ userId: principal.id, targetType, targetId, type: "like" });
      await this.applyCounter(tx, targetType, targetId, 1);
      return { liked: true };
    });
  },

  async applyCounter(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], targetType: string, targetId: string, delta: number) {
    const expr = delta > 0 ? sql`${articles.likeCount} + 1` : sql`GREATEST(${articles.likeCount} - 1, 0)`;
    if (targetType === "article") {
      await tx.update(articles).set({ likeCount: expr }).where(eq(articles.id, targetId));
    } else {
      await tx
        .update(comments)
        .set({ likeCount: delta > 0 ? sql`${comments.likeCount} + 1` : sql`GREATEST(${comments.likeCount} - 1, 0)` })
        .where(eq(comments.id, targetId));
    }
  },
};

export const bookmarkService = {
  async toggle(principal: Principal, articleId: string) {
    const [existing] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, principal.id), eq(bookmarks.articleId, articleId)))
      .limit(1);
    return db.transaction(async (tx) => {
      if (existing) {
        await tx.delete(bookmarks).where(eq(bookmarks.id, existing.id));
        await tx
          .update(articles)
          .set({ bookmarkCount: sql`GREATEST(${articles.bookmarkCount} - 1, 0)` })
          .where(eq(articles.id, articleId));
        return { bookmarked: false };
      }
      await tx.insert(bookmarks).values({ userId: principal.id, articleId });
      await tx
        .update(articles)
        .set({ bookmarkCount: sql`${articles.bookmarkCount} + 1` })
        .where(eq(articles.id, articleId));
      return { bookmarked: true };
    });
  },

  async list(principal: Principal) {
    const rows = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, principal.id))
      .orderBy(desc(bookmarks.createdAt));
    return rows.map((r) => ({ bookmarkedAt: r.createdAt, articleId: r.articleId }));
  },
};

export const followService = {
  async toggle(principal: Principal, targetType: "reporter" | "category", targetId: string) {
    const [existing] = await db
      .select()
      .from(follows)
      .where(
        and(eq(follows.userId, principal.id), eq(follows.targetType, targetType), eq(follows.targetId, targetId)),
      )
      .limit(1);
    if (existing) {
      await db.delete(follows).where(eq(follows.id, existing.id));
      return { following: false };
    }
    if (targetType === "reporter") {
      const [u] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, targetId), eq(users.role, "reporter")))
        .limit(1);
      if (!u) throw new AppError(ErrorCode.INVALID_REFERENCE, 400);
    } else {
      const [c] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, targetId), isNull(categories.deletedAt)))
        .limit(1);
      if (!c) throw new AppError(ErrorCode.INVALID_REFERENCE, 400);
      await db
        .update(categories)
        .set({ followerCount: sql`${categories.followerCount} + 1` })
        .where(eq(categories.id, targetId));
    }
    await db.insert(follows).values({ userId: principal.id, targetType, targetId });
    return { following: true };
  },
};

export const notificationService = {
  async list(principal: Principal, limit: number) {
    const [items, unreadRows] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, principal.id))
        .orderBy(desc(notifications.createdAt))
        .limit(limit),
      db
        .select({ id: notifications.id })
        .from(notifications)
        .where(and(eq(notifications.userId, principal.id), eq(notifications.read, false))),
    ]);
    return { items, unread: unreadRows.length };
  },

  async markRead(principal: Principal, id: string) {
    await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, principal.id)));
    return { read: true };
  },

  async markAllRead(principal: Principal) {
    await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notifications.userId, principal.id), eq(notifications.read, false)));
    return { allRead: true };
  },

  async create(input: {
    userId: string;
    type: "new_article" | "breaking" | "comment_reply" | "comment_like" | "reporter_article_status";
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
    deepLink?: string;
    data?: Record<string, unknown>;
  }) {
    const [row] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
        deepLink: input.deepLink,
        data: (input.data ?? {}) as object,
      })
      .returning();
    return row;
  },
};
