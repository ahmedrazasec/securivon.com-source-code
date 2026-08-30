import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminLoginSchema } from "@/server/validation/schemas";
import { authenticateAdmin } from "@/server/repositories/adminUserRepository";
import {
  createAdminSessionToken,
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
} from "@/server/auth/session";
import { isLoginRateLimited, recordFailedLoginAttempt, emailIdentifier, ipIdentifier } from "@/server/auth/loginRateLimit";
import { getClientIp } from "@/server/http/clientIp";
import { container } from "@/server/container";

// Intentionally excluded from proxy.ts's auth check (see src/proxy.ts) —
// this is the endpoint that ISSUES the session, so it can't require one.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Brute-force protection — see loginRateLimit.ts for why this is
  // DB-backed rather than an in-memory counter. Two independent
  // identifiers (email + IP); blocked if EITHER is currently over the
  // limit. Checked BEFORE running authenticateAdmin so a blocked request
  // never even reaches bcrypt — and the 429 response is identical
  // regardless of which identifier tripped, or whether the email exists.
  const identifiers = [emailIdentifier(parsed.data.email), ipIdentifier(getClientIp(request))];
  const rateLimitDeps = { loginAttempts: container.loginAttempts };

  if (await isLoginRateLimited(rateLimitDeps, identifiers)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const admin = await authenticateAdmin(parsed.data.email, parsed.data.password);

  if (!admin) {
    // Record the failure for rate-limiting purposes ONLY after confirming
    // this request wasn't already blocked above — see
    // recordFailedLoginAttempt's own doc comment for why recording while
    // already-blocked would let an attacker indefinitely extend a victim's
    // lockout window.
    await recordFailedLoginAttempt(rateLimitDeps, identifiers);
    // Deliberately identical response whether the email doesn't exist or the
    // password is wrong — never confirm which one was incorrect.
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await createAdminSessionToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
  });

  const response = NextResponse.json({ ok: true, email: admin.email, role: admin.role });
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
  return response;
}
