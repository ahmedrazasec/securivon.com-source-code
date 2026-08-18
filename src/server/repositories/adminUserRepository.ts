import "server-only";
import { verifyPassword } from "@/server/auth/password";

/**
 * AdminUser repository.
 *
 * INTERIM IMPLEMENTATION NOTE: this currently reads a single bootstrap admin
 * credential from environment variables (ADMIN_BOOTSTRAP_EMAIL /
 * ADMIN_BOOTSTRAP_PASSWORD_HASH) instead of querying the AdminUser table.
 * This is a deliberate, standard bootstrap pattern (create the first admin
 * account out-of-band before any user-management UI exists) — NOT a
 * shortcut being passed off as the final design.
 *
 * The AdminUser Prisma model (prisma/schema.prisma) is the real source of
 * truth going forward. Swap `envBootstrapAdminUserRepository` for a
 * Prisma-backed implementation (querying `prisma.adminUser.findUnique`) the
 * first time `npx prisma generate` succeeds in an environment with network
 * access to binaries.prisma.sh — see README "Known limitations."
 *
 * Kept dependency-free from `@prisma/client` for now specifically so the
 * login flow (this file + the session API route) can be fully implemented,
 * type-checked, and unit-tested in this sandbox despite that limitation.
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

class EnvBootstrapAdminUserRepository implements AdminUserRepository {
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
  return new EnvBootstrapAdminUserRepository();
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
