import { asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { auditRepo } from "../repositories/audit.repo";
import { appSettings } from "../db/schema";
import type { Principal } from "../middleware/auth";

/** App contact / advertisement settings (super admin only — REQ-ADS-001..003). */
export const appSettingsService = {
  async getPublic(): Promise<Record<string, unknown>> {
    const rows = await db.select().from(appSettings).where(eq(appSettings.isPublic, true));
    const data: Record<string, unknown> = {};
    for (const r of rows) data[r.key] = r.value;
    return data;
  },

  async getAll() {
    return db.select().from(appSettings).orderBy(asc(appSettings.key));
  },

  async upsertMany(principal: Principal, entries: Record<string, unknown>, isPublic: Record<string, boolean>) {
    const results: Array<{ key: string }> = [];
    for (const [key, value] of Object.entries(entries)) {
      const [before] = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
      await db
        .insert(appSettings)
        .values({ key, value: value as object, isPublic: isPublic[key] ?? false, updatedBy: principal.id })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: { value: value as object, isPublic: isPublic[key] ?? before?.isPublic ?? false, updatedBy: principal.id },
        });
      await auditRepo.record({
        actorId: principal.id,
        action: "app_settings.update",
        targetType: "app_settings",
        targetId: null,
        meta: { key, before: before?.value ?? null, after: value },
      });
      results.push({ key });
    }
    return results;
  },
};
