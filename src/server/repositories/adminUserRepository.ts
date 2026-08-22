import "server-only";
import { verifyPassword } from "@/server/auth/password";
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
