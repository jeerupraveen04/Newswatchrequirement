import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/session";

export async function POST() {
  clearSessionCookies();
  return NextResponse.json({ success: true, data: { loggedOut: true }, error: null });
}
