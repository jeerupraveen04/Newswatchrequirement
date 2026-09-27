import { Redis } from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

// ioredis emits 'error'; without a handler the process crashes (REQ-SYS-346
// fail-soft: cache/queue outages must not take down the API).
redis.on("error", (err) => logger.warn({ err }, "redis error"));

export async function pingRedis(): Promise<void> {
  await redis.ping();
}
