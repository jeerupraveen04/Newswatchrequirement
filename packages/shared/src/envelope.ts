/** Standard API envelope (docs/architecture/04-api.md §1.3). */

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiSuccess<T, M = Record<string, unknown>> {
  success: true;
  data: T;
  meta: M;
  error: null;
}

export interface ApiFailure {
  success: false;
  data: null;
  meta: Record<string, unknown>;
  error: ApiError;
}

export type ApiResponse<T, M = Record<string, unknown>> = ApiSuccess<T, M> | ApiFailure;

export interface PaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
  total?: number;
}

export function ok<T, M = Record<string, unknown>>(data: T, meta?: M): ApiSuccess<T, M> {
  return { success: true, data, meta: (meta ?? {}) as M, error: null };
}

export function fail(code: string, message: string, fields?: Record<string, string>): ApiFailure {
  return { success: false, data: null, meta: {}, error: { code, message, fields } };
}
