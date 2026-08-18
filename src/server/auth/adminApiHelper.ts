import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME, type AdminSessionPayload } from "@/server/auth/session";
import { isAuthorized, type AdminAction } from "@/server/auth/authorize";

/**
 * Shared Admin route handler wrapper.
 *
 * proxy.ts already blocks unauthenticated requests to /api/admin/* before
 * they reach any route handler (defense layer 1). This wrapper is defense
 * layer 2 — every individual Admin API route re-checks independently rather
 * than trusting proxy.ts alone, per Stage 2 §14 ("all Admin mutations must
 * require authenticated Admin session ... perform authorization checks").
 *
 * Centralizing this here means every new CRUD route gets the same
 * auth/error-shape behavior automatically, rather than each route
 * reimplementing (and potentially getting wrong) the same check.
 */
export async function withAdminAuth(
  request: NextRequest,
  action: AdminAction,
  handler: (session: AdminSessionPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminSessionToken(token) : null;

  if (!isAuthorized(session, action)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await handler(session!);
  } catch (error) {
    // Never leak internal error detail (stack traces, DB errors) to the
    // client — log server-side, return a generic message. Phase 4 §3.18 /
    // Stage 2 §14 "return safe errors."
    console.error("[admin-api-error]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
