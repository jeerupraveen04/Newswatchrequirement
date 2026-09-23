import { sql } from "../db/client";
import { logger } from "../config/logger";

/**
 * PGMQ-backed queue (docs/architecture/03-backend-architecture.md §8).
 * PGMQ is a PostgreSQL extension; we call its functions via SQL.
 * This replaces BullMQ/Redis for job transport.
 */

export type QueueName =
  | "media_probe"
  | "media_transcode"
  | "media_poster"
  | "media_delete"
  | "notification_push"
  | "email_send"
  | "sms_send"
  | "article_scheduled_publish"
  | "analytics_ingest"
  | "poster_render";

export interface JobEnvelope<T = unknown> {
  eventId: string;
  occurredAt: string;
  correlationId?: string;
  data: T;
}

export const queue = {
  async send<T>(queueName: QueueName, job: JobEnvelope<T>, delaySeconds = 0): Promise<number> {
    const message = JSON.stringify(job);
    if (delaySeconds > 0) {
      const rows = await sql<{ send: number }[]>`
        SELECT pgmq.send(${queueName}::text, ${message}::jsonb, ${delaySeconds}::integer) AS send
      `;
      return rows[0]?.send ?? 0;
    }
    const rows = await sql<{ send: number }[]>`
      SELECT pgmq.send(${queueName}::text, ${message}::jsonb) AS send
    `;
    return rows[0]?.send ?? 0;
  },

  /** Read up to `qty` messages with a visibility timeout (seconds). */
  async read<T>(queueName: QueueName, qty = 1, vtSeconds = 60): Promise<Array<{ msgId: number; readCount: number; message: JobEnvelope<T> }>> {
    const rows = await sql<{ msg_id: number; read_ct: number; message: JobEnvelope<T> }[]>`
      SELECT msg_id, read_ct, message FROM pgmq.read(${queueName}::text, ${vtSeconds}::integer, ${qty}::integer)
    `;
    return rows.map((r) => ({ msgId: r.msg_id, readCount: r.read_ct, message: r.message }));
  },

  async archive(queueName: QueueName, msgId: number): Promise<void> {
    await sql`SELECT pgmq.archive(${queueName}::text, ${msgId}::bigint)`;
  },

  /** Dead-letter a message that exceeded max attempts. */
  async deadLetter(queueName: QueueName, msgId: number): Promise<void> {
    await sql`SELECT pgmq.archive(${queueName}::text, ${msgId}::bigint)`;
  },

  async delete(queueName: QueueName, msgId: number): Promise<void> {
    await sql`SELECT pgmq.delete(${queueName}::text, ${msgId}::bigint)`;
  },

  async metrics(queueName: QueueName) {
    const rows = await sql<{ queue_name: string; queue_length: number; total_messages: number }[]>`
      SELECT queue_name, queue_length, total_messages FROM pgmq.metrics(${queueName}::text)
    `;
    return rows[0] ?? null;
  },
};

export type JobHandler<T> = (data: T, envelope: JobEnvelope<T>) => Promise<void>;

/**
 * Minimal polling worker loop. Runs until `signal.aborted`.
 * Individual job failures are logged; the message becomes visible again
 * after the visibility timeout for retry.
 */
export async function runWorker<T>(
  queueName: QueueName,
  handler: JobHandler<T>,
  opts: { pollIntervalMs?: number; vtSeconds?: number; maxAttempts?: number; signal: AbortSignal },
): Promise<void> {
  const poll = opts.pollIntervalMs ?? 1000;
  const vt = opts.vtSeconds ?? 60;
  const maxAttempts = opts.maxAttempts ?? 5;
  logger.info({ queueName }, "worker started");

  while (!opts.signal.aborted) {
    try {
      const jobs = await queue.read<T>(queueName, 1, vt);
      if (jobs.length === 0) {
        await new Promise((r) => setTimeout(r, poll));
        continue;
      }
      for (const job of jobs) {
        try {
          await handler(job.message.data, job.message);
          await queue.archive(queueName, job.msgId);
        } catch (err) {
          logger.error({ queueName, msgId: job.msgId, readCount: job.readCount, err }, "job failed");
          if (job.readCount >= maxAttempts) {
            // Dead-letter: stop infinite retries (REQ-SYS-351).
            logger.error({ queueName, msgId: job.msgId }, "max attempts reached; dead-lettering");
            await queue.deadLetter(queueName, job.msgId).catch(() => undefined);
          }
          // else: leave for retry after visibility timeout
        }
      }
    } catch (err) {
      logger.error({ queueName, err }, "worker poll error");
      await new Promise((r) => setTimeout(r, poll));
    }
  }
}
