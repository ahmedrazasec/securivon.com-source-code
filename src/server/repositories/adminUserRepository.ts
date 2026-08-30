import "server-only";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { PrismaAdminUserRepository } from "@/server/repositories/prisma/adminUser.prisma";

/**
 * AdminUser repository.
 *
 * ACTIVE IMPLEMENTATION: `getAdminUserRepository()` below returns
 * `PrismaAdminUserRepository` — real, database-backed Admin login against
 * the AdminUser table via Prisma 7 / the driver adapter / Supabase
 * PostgreSQL. This swap was prepared and applied in a sandbox that cannot
 * itself run `npx prisma generate` (see note below) — confirm it actually
 * compiles and logs in correctly on Windows before relying on it.
 *
 * `EnvBootstrapAdminUserRepository` (below) is kept as a documented
 * break-glass fallback — a way to log in with ADMIN_BOOTSTRAP_EMAIL /
 * ADMIN_BOOTSTRAP_PASSWORD_HASH if the AdminUser table is ever empty or
 * unreachable — but is no longer the default. Do not remove those env
 * vars from README/.env.example while this fallback class still exists.
 *
 * SANDBOX BUILD NOTE — this environment cannot verify this change compiles
 * or runs, because `npx prisma generate` fails here (no network path to
 * binaries.prisma.sh — confirmed directly, not assumed). Expect
 * `npm run typecheck` and `npm run build` to fail in THIS sandbox with
 * "Cannot find module '@/generated/prisma/client'" until run somewhere
 * with a generated client. This is expected and does not indicate a bug in
 * the change itself — verify with the actual results on Windows.
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
