import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      correlationId: string;
    }
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.header("X-Request-Id") as string) || randomUUID();
  req.requestId = requestId;
  req.correlationId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}
