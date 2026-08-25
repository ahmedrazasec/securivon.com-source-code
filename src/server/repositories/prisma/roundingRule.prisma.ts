import "server-only";
import { prisma } from "@/server/db/client";
import type { RoundingRuleRepository, RoundingRuleRecord, RoundingRuleUpdateInput } from "@/server/repositories/types";

type RoundingRuleCreateData = Parameters<typeof prisma.roundingRule.create>[0]["data"];
type RoundingRuleUpdateData = Parameters<typeof prisma.roundingRule.update>[0]["data"];

/** Real, database-backed RoundingRuleRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaRoundingRuleRepository implements RoundingRuleRepository {
  async getCurrent() {
    const r = await prisma.roundingRule.findFirst({ orderBy: { updatedAt: "desc" } });
    return r ? toRecord(r) : null;
  }
  async upsert(input: RoundingRuleUpdateInput) {
    const existing = await prisma.roundingRule.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!existing) {
      const data: RoundingRuleCreateData = { granularity: input.granularity ?? 500, direction: input.direction as RoundingRuleCreateData["direction"] };
      return toRecord(await prisma.roundingRule.create({ data }));
    }
    const data: RoundingRuleUpdateData = { ...input, direction: input.direction as RoundingRuleUpdateData["direction"] };
    return toRecord(await prisma.roundingRule.update({ where: { id: existing.id }, data }));
  }
}

function toRecord(r: NonNullable<Awaited<ReturnType<typeof prisma.roundingRule.create>>>): RoundingRuleRecord {
  return { id: r.id, granularity: Number(r.granularity), direction: r.direction };
}
