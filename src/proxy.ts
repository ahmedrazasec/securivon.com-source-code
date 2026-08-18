import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/server/auth/session";

/**
 * Route protection for /admin/* and /api/admin/*.
 *
 * NOTE: this file is named `proxy.ts`, not `middleware.ts`. Next.js 16
 * deprecated and renamed the middleware.js convention to proxy.js — using
 * the old filename would silently do nothing in this Next.js version. This
 * was confirmed against this project's actual installed Next.js version
 * (see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md)
 * rather than assumed from general Next.js familiarity, because this
 * version's own generated AGENTS.md explicitly warns that conventions may
 * differ from training data.
 *
 * The login page itself (/admin/login) and its API route
 * (/api/admin/session) are deliberately excluded from the matcher below —
 * otherwise nobody could ever reach the login form to authenticate.
 */
export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isSessionApi = request.nextUrl.pathname === "/api/admin/session";
  if (isLoginPage || isSessionApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminSessionToken(token) : null;

  if (!session) {
    if (request.nextUrl.pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
