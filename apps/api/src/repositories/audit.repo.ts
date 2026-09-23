import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { auditLogs } from "../db/schema";

/** Immutable audit trail (REQ-DEL-005, REQ-ADS-002, REQ-SYS-357). */

export const auditRepo = {
  async record(input: {
    actorId?: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    meta?: Record<string, unknown>;
    ip?: string | null;
  }) {
    await db.insert(auditLogs).values({
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      meta: (input.meta ?? {}) as object,
      ip: input.ip ?? null,
    });
  },

  async list(params: { cursor?: string; limit: number; targetType?: string }) {
    const rows = params.targetType
      ? await db
          .select()
          .from(auditLogs)
          .where(eq(auditLogs.targetType, params.targetType))
          .orderBy(desc(auditLogs.createdAt))
          .limit(params.limit + 1)
      : await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(params.limit + 1);
    return rows;
  },
};
