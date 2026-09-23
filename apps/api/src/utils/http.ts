import type { Request, Response, NextFunction } from "express";
import type { ApiSuccess } from "@newswatch/shared";

export function respond<T, M = Record<string, unknown>>(
  res: Response,
  status: number,
  data: T,
  meta?: M,
): Response {
  const body: ApiSuccess<T, M> = { success: true, data, meta: (meta ?? {}) as M, error: null };
  return res.status(status).json(body);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
