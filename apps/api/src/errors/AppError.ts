import { ErrorCode, HttpStatusByErrorCode } from "@newswatch/shared";

export class AppError extends Error {
  public readonly status: number;
  constructor(
    public readonly code: ErrorCode,
    status?: number,
    message?: string,
    public readonly fields?: Record<string, string>,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = "AppError";
    this.status = status ?? HttpStatusByErrorCode[code] ?? 400;
  }
}

export const errors = {
  authRequired: () => new AppError(ErrorCode.AUTH_REQUIRED, 401),
  forbidden: (msg?: string) => new AppError(ErrorCode.FORBIDDEN, 403, msg),
  outOfScope: () => new AppError(ErrorCode.OUT_OF_SCOPE, 403, "Out of your region scope"),
  notFound: (msg?: string) => new AppError(ErrorCode.NOT_FOUND, 404, msg),
  conflict: (msg?: string) => new AppError(ErrorCode.CONFLICT, 409, msg),
  validation: (fields: Record<string, string>, msg = "Validation failed") =>
    new AppError(ErrorCode.VALIDATION_ERROR, 422, msg, fields),
};
