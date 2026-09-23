import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodType } from "zod";
import { ErrorCode } from "@newswatch/shared";
import { AppError } from "../errors/AppError";

export function validate(schemas: { body?: ZodType; query?: ZodType; params?: ZodType }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params) as never;
      if (schemas.query) req.query = schemas.query.parse(req.query) as never;
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of e.issues) fields[issue.path.join(".") || "_"] = issue.message;
        next(new AppError(ErrorCode.VALIDATION_ERROR, 422, "Validation failed", fields));
        return;
      }
      next(e);
    }
  };
}
