import { Redis } from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export async function pingRedis(): Promise<void> {
  await redis.ping();
}
