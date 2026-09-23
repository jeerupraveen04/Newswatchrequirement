import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

/**
 * Authenticated proxy for client components: forwards to the API with the
 * httpOnly access token and returns the envelope unchanged.
 * Usage: fetch(`/api/proxy/articles/feed`)
 */
async function forward(req: Request, path: string[]) {
  const token = getAccessToken();
  const search = new URL(req.url).search;
  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  };
  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = await req.text();
  }
  const res = await fetch(`${API_URL}/${path.join("/")}${search}`, init);
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
