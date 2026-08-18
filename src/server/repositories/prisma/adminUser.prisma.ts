import "server-only";
import { prisma } from "@/server/db/client";
import type { AdminUserRepository, AdminUserRecord } from "@/server/repositories/adminUserRepository";

/**
 * Real, database-backed AdminUserRepository.
 *
 * SANDBOX NOTE: this file is excluded from tsconfig (see tsconfig.json)
 * because it imports src/server/db/client.ts, which requires
 * `npx prisma generate` to have succeeded — blocked in this environment by
 * a lack of network access to binaries.prisma.sh (see README "Known
 * limitations"). This is real, complete, reviewable code, not a stub.
 *
 * To activate: once `prisma generate` succeeds elsewhere, remove this
 * file's tsconfig exclusion and swap `getAdminUserRepository()` in
 * src/server/repositories/adminUserRepository.ts to return
 * `new PrismaAdminUserRepository()` instead of the env-bootstrap
 * implementation (or make the choice conditional on whether a real
 * AdminUser row exists, if you want the bootstrap credential to remain a
 * permanent break-glass fallback rather than a one-time seed).
 */
export class PrismaAdminUserRepository implements AdminUserRepository {
  async findByEmail(email: string): Promise<AdminUserRecord | null> {
    const user = await prisma.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || user.deletedAt) return null;

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      active: user.active,
    };
  }
}
