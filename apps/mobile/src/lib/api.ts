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

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ?? accessToken ? { Authorization: `Bearer ${options.token ?? accessToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const body = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !body.success) {
    const err = (body as { error?: { code: string; message: string; fields?: Record<string, string> } }).error;
    throw new ApiError(err?.code ?? "INTERNAL_ERROR", err?.message ?? "Request failed", res.status, err?.fields);
  }
  return body.data;
}
