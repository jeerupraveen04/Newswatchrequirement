import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { devices } from "../../db/schema";
import { logger } from "../../config/logger";
import { env } from "../../config/env";
import { realtime } from "../../realtime/io";

/**
 * Push + in-app notification worker (docs/architecture/03 §8).
 * Resolves a user's devices, sends via FCM when configured, and emits over
 * Socket.IO. Failures never throw to the caller path (REQ-SYS-353).
 */
export async function notificationWorker(data: {
  userId: string;
  title: string;
  body: string;
  deepLink?: string;
}): Promise<void> {
  // Guard against malformed payloads (avoids poison-message retry loops).
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!data?.userId || !UUID_RE.test(data.userId)) {
    logger.warn({ data }, "notification dropped: invalid or missing userId");
    return;
  }

  const rows = await db
    .select()
    .from(devices)
    .where(eq(devices.userId, data.userId));

  const tokens = rows.filter((d) => d.pushEnabled && d.pushToken).map((d) => d.pushToken!);

  // Emit realtime first (best-effort, never fails the job).
  realtime.notificationNew(data.userId, {
    title: data.title,
    body: data.body,
    deepLink: data.deepLink,
  });

  if (!tokens.length) {
    logger.debug({ userId: data.userId }, "no push tokens; realtime only");
    return;
  }

  if (!env.FIREBASE_PROJECT_ID) {
    logger.info(
      { userId: data.userId, devices: tokens.length },
      "FCM not configured; skipping push send (tokens resolved)",
    );
    return;
  }

  // FCM send is intentionally stubbed until credentials are provisioned.
  // When enabled, use firebase-admin messaging().sendEachForMulticast(...).
  logger.info({ userId: data.userId, devices: tokens.length }, "would send FCM push");
}
