import type { Request, Response, NextFunction } from "express";
import { ErrorCode } from "@newswatch/shared";
import { AppError } from "../errors/AppError";
import { logger } from "../config/logger";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(ErrorCode.NOT_FOUND, 404, "Route not found"));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  let status = 500;
  let code: string = ErrorCode.INTERNAL_ERROR;
  let message = "Internal server error";
  let fields: Record<string, string> | undefined;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    fields = err.fields;
  } else if (typeof err === "object" && err && "code" in err) {
    const anyErr = err as { code?: string; meta?: { target?: string[] } };
    if (anyErr.code === "P2002") {
      status = 409;
      code = ErrorCode.CONFLICT;
      message = "Resource already exists";
      const target = anyErr.meta?.target;
      if (target) fields = { [target.join(",")]: "duplicate" };
    } else if (anyErr.code === "P2025") {
      status = 404;
      code = ErrorCode.NOT_FOUND;
      message = "Resource not found";
    } else if (anyErr.code === "P2003") {
      status = 400;
      code = ErrorCode.INVALID_REFERENCE;
      message = "Invalid reference";
    }
  }

  if (status >= 500) {
    logger.error({ requestId: req.requestId, err }, "Unhandled error");
  }

  res.status(status).json({
    success: false,
    data: null,
    meta: {},
    error: { code, message, fields: fields ?? {} },
  });
}
