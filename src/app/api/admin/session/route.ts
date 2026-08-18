import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminLoginSchema } from "@/server/validation/schemas";
import { authenticateAdmin } from "@/server/repositories/adminUserRepository";
import {
  createAdminSessionToken,
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
} from "@/server/auth/session";

// Intentionally excluded from proxy.ts's auth check (see src/proxy.ts) —
// this is the endpoint that ISSUES the session, so it can't require one.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // NOTE: no rate limiting wired in yet at the foundation stage — flagged in
  // the final report as a pre-production requirement (Phase 4 §3.18 /
  // Corrections §6), not silently omitted.
  const admin = await authenticateAdmin(parsed.data.email, parsed.data.password);

  if (!admin) {
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
