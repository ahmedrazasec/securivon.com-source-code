import "server-only";
import { prisma } from "@/server/db/client";
import type { LoginAttemptRepository } from "@/server/repositories/types";

export class PrismaLoginAttemptRepository implements LoginAttemptRepository {
  async countRecentFailures(identifier: string, sinceMs: number): Promise<number> {
    return prisma.loginAttempt.count({
      where: { identifier, createdAt: { gte: new Date(sinceMs) } },
    });
  }

  async recordFailure(identifier: string, atMs?: number): Promise<void> {
    await prisma.loginAttempt.create({ data: { identifier, createdAt: atMs !== undefined ? new Date(atMs) : undefined } });
  }

  async pruneOlderThan(beforeMs: number): Promise<void> {
    await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(beforeMs) } } });
  }
}
