import { logger } from "./logger";

type Entry = { value: number; expiresAt: number | null };

/**
 * Process-local in-memory cache + fixed-window counter store.
 * Replaces Redis for single-instance deployments (REQ-SYS-346 fail-soft).
 * State is never shared across processes, so horizontal scaling degrades to
 * per-instance rate limits and single-instance Socket.IO fan-out.
 */
class MemoryCache {
  private readonly store = new Map<string, Entry>();
  private readonly sweeper: NodeJS.Timeout;

  constructor() {
    // Opportunistic eviction so expired keys do not accumulate.
    this.sweeper = setInterval(() => this.sweep(), 60_000);
    this.sweeper.unref?.();
  }

  private isExpired(entry: Entry): boolean {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }

  private sweep(): void {
    for (const [key, entry] of this.store) {
      if (this.isExpired(entry)) this.store.delete(key);
    }
  }

  /** Increment a counter by 1, creating it at 1 when absent or expired. */
  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (entry && !this.isExpired(entry)) {
      entry.value += 1;
      return entry.value;
    }
    this.store.set(key, { value: 1, expiresAt: null });
    return 1;
  }

  /** Set the time-to-live (seconds) on an existing key. */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) entry.expiresAt = Date.now() + ttlSeconds * 1000;
  }

  /** Seconds until expiry: -1 no TTL, -2 missing. Redis-compatible semantics. */
  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (entry.expiresAt === null) return -1;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return -2;
    }
    return Math.ceil((entry.expiresAt - Date.now()) / 1000);
  }

  async set(key: string, value: number, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  reset(): void {
    this.store.clear();
  }
}

export const cache = new MemoryCache();

/** Liveness probe for the in-memory cache (used by `/ready`). */
export async function pingCache(): Promise<void> {
  const key = "__ping__";
  await cache.set(key, 1, 5);
  const value = await cache.get(key);
  if (value !== 1) throw new Error("cache ping failed");
}

logger.debug("in-memory cache initialized");
