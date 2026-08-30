import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { changeOwnPassword as changeOwnPasswordCore } from "@/server/repositories/adminUserRepository";

/**
 * Admin "change my own password" route handler.
 *
 * Mounted at src/app/api/admin/account/password/route.ts — that file only
 * adapts the Next.js route shape to this function; edit request handling
 * here. The actual verify-then-write logic lives in
 * `changeOwnPassword` (src/server/repositories/adminUserRepository.ts),
 * tested there against a fake repository, the same way `authenticateAdmin`
 * already is.
 *
 * Scope is deliberately narrow: an authenticated admin changing their OWN
 * password (verified via their current password), not an admin-management
 * UI for resetting other users' passwords or managing roles/active status —
 * that's a separate, larger feature (multi-admin user management) not
 * requested here.
 */

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    // 10 chars, not the login form's 8 — a new password is a good moment to
    // nudge toward a slightly stronger minimum without changing what
    // already-issued credentials must satisfy to log in.
    newPassword: z.string().min(10, "New password must be at least 10 characters."),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export async function changeOwnPassword(request: NextRequest) {
  return withAdminAuth(request, "VIEW_ADMIN", async (session) => {
    const parsed = changePasswordSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const result = await changeOwnPasswordCore(session.sub, parsed.data.currentPassword, parsed.data.newPassword);

    if (!result.ok) {
      if (result.reason === "INCORRECT_CURRENT_PASSWORD") {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
      }
      // NOT_FOUND / BOOTSTRAP_ACCOUNT — neither should normally be reachable
      // from a valid session, but never leak which one to the client.
      return NextResponse.json(
        { error: "This account cannot change its password here. Contact an administrator." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  });
}
