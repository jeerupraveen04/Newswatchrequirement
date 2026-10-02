import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { getAccessToken, getRefreshToken, setSessionCookies, clearSessionCookies } from "@/lib/session";

/**
 * Authenticated proxy for client components: forwards to the API with the
 * httpOnly access token and returns the envelope unchanged.
 * On 401 it attempts a single refresh (rotating tokens) and retries so a
 * 15-minute access token expiring does not drop the session.
 * Usage: fetch(`/api/proxy/articles/feed`)
 */

interface RefreshResponse {
  success: boolean;
  data?: { accessToken: string; refreshToken: string };
}

async function tryRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
      cache: "no-store",
    });
    const body = (await res.json()) as RefreshResponse;
    if (!res.ok || !body.success || !body.data) {
      clearSessionCookies();
      return null;
    }
    setSessionCookies(body.data.accessToken, body.data.refreshToken);
    return body.data.accessToken;
  } catch {
    return null;
  }
}

async function forward(req: Request, path: string[]) {
  const search = new URL(req.url).search;
  const hasBody = !["GET", "HEAD"].includes(req.method);
  const rawBody = hasBody ? await req.text() : undefined;

  const call = (token: string | undefined) =>
    fetch(`${API_URL}/${path.join("/")}${search}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: rawBody,
      cache: "no-store",
    });

  let token = getAccessToken();
  let res = await call(token);
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await call(refreshed);
  }

  const data = await res.json().catch(() => ({ success: false, data: null, error: { code: "BAD_RESPONSE" } }));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
export async function POST(req: Request, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
export async function PATCH(req: Request, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
export async function PUT(req: Request, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
export async function DELETE(req: Request, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
