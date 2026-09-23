import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { setSessionCookies, getSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return NextResponse.json(data, { status: res.status });
  }
  setSessionCookies(data.data.accessToken, data.data.refreshToken);
  return NextResponse.json({ success: true, data: { user: data.data.user }, error: null });
}

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ success: true, data: session, error: null });
}
