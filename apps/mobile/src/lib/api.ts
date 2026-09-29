import Constants from "expo-constants";
import type { ApiResponse } from "@newswatch/shared";

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; socketUrl?: string };

export const API_URL = extra.apiUrl ?? "http://localhost:4010/api/v1";
export const SOCKET_URL = extra.socketUrl ?? "http://localhost:4010";

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = `${API_URL}${path}`;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `${url}?${params.join("&")}` : url;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  query?: Query;
}

async function request<T>(path: string, options: RequestOptions): Promise<{ data: T; meta: PageMeta }> {
  const token = options.token ?? accessToken;
  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("INTERNAL_ERROR", "Something went wrong. Check your connection.", res.status);
  }
  if (!res.ok || !body.success) {
    const err = (body as { error?: { code: string; message: string; fields?: Record<string, string> } }).error;
    throw new ApiError(err?.code ?? "INTERNAL_ERROR", err?.message ?? "Request failed", res.status, err?.fields);
  }
  const meta = (body.meta ?? {}) as Partial<PageMeta>;
  return {
    data: body.data,
    meta: { nextCursor: meta.nextCursor ?? null, hasMore: meta.hasMore ?? false, limit: meta.limit ?? 20 },
  };
}

/** Unwrap `data` (most callers). */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await request<T>(path, options)).data;
}

/** Full envelope when pagination meta is needed. */
export async function apiPage<T>(path: string, options: RequestOptions = {}): Promise<{ data: T; meta: PageMeta }> {
  return request<T>(path, options);
}
