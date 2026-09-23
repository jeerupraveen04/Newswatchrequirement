import { cookies } from "next/headers";
import { API_URL } from "./api";
import type { SessionUser } from "./types";

export const ACCESS_COOKIE = "nw_access";
export const REFRESH_COOKIE = "nw_refresh";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setSessionCookies(accessToken: string, refreshToken: string) {
  const jar = cookies();
  jar.set(ACCESS_COOKIE, accessToken, { ...COOKIE_OPTS, maxAge: 60 * 15 });
  jar.set(REFRESH_COOKIE, refreshToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 30 });
}

export function clearSessionCookies() {
  const jar = cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export function getAccessToken(): string | undefined {
  return cookies().get(ACCESS_COOKIE)?.value;
}

export function getRefreshToken(): string | undefined {
  return cookies().get(REFRESH_COOKIE)?.value;
}

export interface SessionInfo {
  user: SessionUser | null;
  role: string | null;
  regionScopes: string[];
  reporterStatus: string | null;
}

/** Fetch the current session from the API using the access cookie. */
export async function getSession(): Promise<SessionInfo> {
  const token = getAccessToken();
  if (!token) return { user: null, role: null, regionScopes: [], reporterStatus: null };
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { user: null, role: null, regionScopes: [], reporterStatus: null };
    const body = (await res.json()) as { success: boolean; data: SessionInfo };
    return body.data;
  } catch {
    return { user: null, role: null, regionScopes: [], reporterStatus: null };
  }
}
