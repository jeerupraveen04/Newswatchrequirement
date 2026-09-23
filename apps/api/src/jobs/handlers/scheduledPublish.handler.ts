import { and, eq, isNull, lte } from "drizzle-orm";
import { db } from "../../db/client";
import { articles } from "../../db/schema";
import { articleRepo } from "../../repositories/article.repo";
import { realtime } from "../../realtime/io";
import { queue } from "../queue";
import { logger } from "../../config/logger";

/**
 * Scheduled-publish worker (REQ-SYS-352).
 * Finds articles whose `scheduled_at` is due and publishes them.
 */
export async function scheduledPublishWorker(_data: { articleId: string }): Promise<void> {
  const due = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "pending"),
        isNull(articles.deletedAt),
        lte(articles.scheduledAt, new Date()),
      ),
    );

  for (const article of due) {
    await db
      .update(articles)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(articles.id, article.id));
    await articleRepo.addStatusHistory({
      articleId: article.id,
      fromStatus: "pending",
      toStatus: "published",
      changedBy: article.reviewedBy ?? null,
      note: "scheduled publish",
    });
    await queue.send("notification_push", {
      eventId: `publish:${article.id}`,
      occurredAt: new Date().toISOString(),
      data: {
        userId: article.reporterId,
        title: "Article published",
        body: `"${article.title}" is now live.`,
        deepLink: `/articles/${article.slug}`,
      },
    });
    realtime.articleStatus(article.reporterId, { id: article.id, status: "published" });
    logger.info({ articleId: article.id }, "scheduled article published");
  }
}
