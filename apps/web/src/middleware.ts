import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth guard for protected areas (admin/reporter/profile) and security headers.
 * Session presence is checked via the httpOnly access cookie; role is enforced
 * authoritatively by the API.
 */
const PROTECTED = ["/reporter", "/bookmarks", "/notifications", "/profile", "/settings", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has("nw_access");
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // /admin/login is public.
  const isAdminLogin = pathname === "/admin/login";

  if (isProtected && !isAdminLogin && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/reporter/:path*",
    "/bookmarks/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
