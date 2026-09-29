import type { Request, Response, NextFunction } from "express";
import { ErrorCode } from "@newswatch/shared";
import { AppError } from "../errors/AppError";
import { cache } from "../config/cache";

export interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyPrefix: string;
  keyFn?: (req: Request) => string;
}

/**
 * In-memory fixed-window limiter (REQ-SYS-380/382).
 * Process-local: limits hold per instance, not across a cluster.
 * Fails open if the cache is unavailable (REQ-SYS-346).
 */
export function rateLimit(opts: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const keyPart = opts.keyFn ? opts.keyFn(req) : (req.user?.id ?? req.ip ?? "anon");
    const key = `rl:${opts.keyPrefix}:${keyPart}`;
    try {
      const count = await cache.incr(key);
      if (count === 1) await cache.expire(key, opts.windowSeconds);
      if (count > opts.max) {
        const ttl = await cache.ttl(key);
        res.setHeader("Retry-After", String(Math.max(ttl, 1)));
        throw new AppError(ErrorCode.RATE_LIMITED, 429, "Too many requests");
      }
      next();
    } catch (e) {
      if (e instanceof AppError) return next(e);
      // Cache failure: degrade to allowing the request.
      next();
    }
  };
}
