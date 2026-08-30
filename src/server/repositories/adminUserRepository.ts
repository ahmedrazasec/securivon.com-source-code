import "server-only";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { PrismaAdminUserRepository } from "@/server/repositories/prisma/adminUser.prisma";

/**
 * AdminUser repository.
 *
 * ACTIVE / PRODUCTION AUTHENTICATION PATH: `getAdminUserRepository()` below
 * returns `PrismaAdminUserRepository` — every real admin login is a
 * database lookup against the `AdminUser` table via Prisma 7 / the driver
 * adapter / Supabase PostgreSQL, verified working end-to-end on Windows.
 * `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD_HASH` are NOT part of
 * this path and are NOT required for normal production login — every real
 * admin account is a row in `AdminUser`, created/managed like any other
 * database record.
 *
 * `EnvBootstrapAdminUserRepository` (below) exists in the codebase but is
 * currently INERT — nothing calls it. `getAdminUserRepository()` never
 * returns it, so as of this batch it has no effect on authentication
 * behavior at all, whether or not the env vars are set. It's kept as an
 * available building block for a possible future break-glass login path
 * (e.g. if the `AdminUser` table is ever empty or the database is
 * unreachable) — but wiring it in as an actual fallback is a deliberate
 * decision to make separately, not something to do silently, since a
 * standing break-glass credential is itself a security trade-off worth
 * making consciously. Until that decision is made, `ADMIN_BOOTSTRAP_*` env
 * vars can be left unset in production with no effect on login.
 */

export interface AdminUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "CONTENT_EDITOR" | "PRICING_MANAGER" | "SALES_OPERATIONS";
  active: boolean;
}

export interface AdminUserRepository {
  findByEmail(email: string): Promise<AdminUserRecord | null>;
  /**
   * Look up by id rather than email — used by the "change my own password"
   * flow, where we already have `session.sub` (AdminUser.id) and want to
   * re-verify the current password without a second email round-trip.
   */
  findById(id: string): Promise<AdminUserRecord | null>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}

/**
 * Currently INERT — see the file header comment above for the full
 * explanation. Nothing in this codebase calls this class today.
 */
export class EnvBootstrapAdminUserRepository implements AdminUserRepository {
  async findByEmail(email: string): Promise<AdminUserRecord | null> {
    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
    const bootstrapPasswordHash = process.env.ADMIN_BOOTSTRAP_PASSWORD_HASH;

    if (!bootstrapEmail || !bootstrapPasswordHash) return null;
    if (email.trim().toLowerCase() !== bootstrapEmail.trim().toLowerCase()) return null;

    return {
      id: "bootstrap-admin",
      email: bootstrapEmail,
      passwordHash: bootstrapPasswordHash,
      role: "ADMIN",
      active: true,
    };
  }

  async findById(id: string): Promise<AdminUserRecord | null> {
    const record = await this.findByEmail(process.env.ADMIN_BOOTSTRAP_EMAIL ?? "");
    return record && record.id === id ? record : null;
  }

  async updatePassword(): Promise<void> {
    // The bootstrap account's credential lives in an env var, not a table
    // row — there is nothing here to write to. Self-service password
    // change is only meaningful for real AdminUser rows; the route handler
    // rejects bootstrap sessions before this would ever be called.
    throw new Error("Cannot change the password of the env-bootstrap admin account.");
  }
}

export function getAdminUserRepository(): AdminUserRepository {
  return new PrismaAdminUserRepository();
}

export async function authenticateAdmin(
  email: string,
  plainTextPassword: string,
  repository: AdminUserRepository = getAdminUserRepository()
): Promise<AdminUserRecord | null> {
  const user = await repository.findByEmail(email);
  if (!user || !user.active) return null;

  const passwordMatches = await verifyPassword(plainTextPassword, user.passwordHash);
  if (!passwordMatches) return null;

  return user;
}

export type PasswordChangeResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "INCORRECT_CURRENT_PASSWORD" | "BOOTSTRAP_ACCOUNT" };

/**
 * Self-service "change my own password" — re-verifies the current password
 * against the stored hash before writing the new one, exactly the way
 * `authenticateAdmin` re-verifies at login. Pulled out of the Next.js route
 * handler (src/server/adminRoutes/account.ts) so it can be unit-tested
 * against a fake repository the same way `authenticateAdmin` is above,
 * independent of Prisma/container wiring.
 */
export async function changeOwnPassword(
  userId: string,
  currentPlainTextPassword: string,
  newPlainTextPassword: string,
  repository: AdminUserRepository = getAdminUserRepository()
): Promise<PasswordChangeResult> {
  const user = await repository.findById(userId);
  if (!user || !user.active) return { ok: false, reason: "NOT_FOUND" };
  if (user.id === "bootstrap-admin") return { ok: false, reason: "BOOTSTRAP_ACCOUNT" };

  const currentPasswordMatches = await verifyPassword(currentPlainTextPassword, user.passwordHash);
  if (!currentPasswordMatches) return { ok: false, reason: "INCORRECT_CURRENT_PASSWORD" };

  const newPasswordHash = await hashPassword(newPlainTextPassword);
  await repository.updatePassword(user.id, newPasswordHash);

  return { ok: true };
}
