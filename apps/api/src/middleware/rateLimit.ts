import type { Request, Response, NextFunction } from "express";
import { ErrorCode } from "@newswatch/shared";
import { AppError } from "../errors/AppError";
import { redis } from "../config/redis";

export interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyPrefix: string;
  keyFn?: (req: Request) => string;
}

/**
 * Redis token-bucket-ish fixed-window limiter (REQ-SYS-380/382).
 * Fails open if Redis is unavailable (REQ-SYS-346).
 */
export function rateLimit(opts: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const keyPart = opts.keyFn ? opts.keyFn(req) : (req.user?.id ?? req.ip ?? "anon");
    const key = `rl:${opts.keyPrefix}:${keyPart}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, opts.windowSeconds);
      if (count > opts.max) {
        const ttl = await redis.ttl(key);
        res.setHeader("Retry-After", String(Math.max(ttl, 1)));
        throw new AppError(ErrorCode.RATE_LIMITED, 429, "Too many requests");
      }
      next();
    } catch (e) {
      if (e instanceof AppError) return next(e);
      // Redis failure: degrade to allowing the request.
      next();
    }
  };
}
