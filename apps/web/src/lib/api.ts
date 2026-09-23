/**
 * Typed API client for the NewsWatch web app.
 * - Server-side: plain fetch to NEXT_PUBLIC_API_URL (public reads, no auth).
 * - Client-side: same base, but callers attach the session via /api/proxy or
 *   read cookies through route handlers.
 */
import type { ApiResponse, PaginationMeta } from "@newswatch/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4010/api/v1";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4010";

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface FetchOptions extends RequestInit {
  /** Server cache revalidation in seconds (public reads). */
  revalidate?: number;
  tags?: string[];
  token?: string;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate, tags, token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    ...(revalidate !== undefined ? { next: { revalidate, tags } } : {}),
  });

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError("INTERNAL_ERROR", "Invalid server response", res.status);
  }

  if (!res.ok || !body.success) {
    const err = (body as { error?: { code: string; message: string; fields?: Record<string, string> } }).error;
    throw new ApiClientError(
      err?.code ?? "INTERNAL_ERROR",
      err?.message ?? "Request failed",
      res.status,
      err?.fields,
    );
  }
  return body.data;
}

export async function apiFetchPage<T>(
  path: string,
  options: FetchOptions = {},
): Promise<{ items: T[]; meta: PaginationMeta }> {
  const { revalidate, tags, token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    ...(revalidate !== undefined ? { next: { revalidate, tags } } : {}),
  });
  const body = (await res.json()) as ApiResponse<T[], PaginationMeta>;
  if (!res.ok || !body.success) {
    throw new ApiClientError("INTERNAL_ERROR", "Request failed", res.status);
  }
  return { items: body.data, meta: body.meta };
}
