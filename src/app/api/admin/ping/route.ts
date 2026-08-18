import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/server/auth/session";
import { isAuthorized } from "@/server/auth/authorize";

/**
 * Protected smoke-test endpoint.
 *
 * Exists purely to prove, end-to-end, that an unauthenticated request to
 * /api/admin/* fails (via proxy.ts) and an authenticated one succeeds — the
 * exact self-check item "confirm /admin is protected." Real Admin data
 * endpoints (products, prices, packages, etc.) are Stage 5+ work, not part
 * of this foundation.
 */
export async function GET(request: NextRequest) {
  // proxy.ts already blocks unauthenticated requests before this handler
  // runs, but the handler re-checks independently — defense in depth, not
  // reliance on a single layer.
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminSessionToken(token) : null;

  if (!isAuthorized(session, "VIEW_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, email: session!.email, role: session!.role });
}
