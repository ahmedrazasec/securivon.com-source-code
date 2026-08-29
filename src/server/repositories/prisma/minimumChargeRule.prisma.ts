import "server-only";
import { prisma } from "@/server/db/client";
import type {
  MinimumChargeRuleRepository,
  MinimumChargeRuleRecord,
  MinimumChargeRuleUpdateInput,
} from "@/server/repositories/types";

/** Real, database-backed MinimumChargeRuleRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaMinimumChargeRuleRepository implements MinimumChargeRuleRepository {
  async list() {
    return (await prisma.minimumChargeRule.findMany({ orderBy: { serviceType: "asc" } })).map(toRecord);
  }
  async findByServiceType(serviceType: string) {
    const r = await prisma.minimumChargeRule.findUnique({ where: { serviceType } });
    return r ? toRecord(r) : null;
  }
  async upsert(serviceType: string, input: MinimumChargeRuleUpdateInput) {
    const result = await prisma.minimumChargeRule.upsert({
      where: { serviceType },
      // Never a fabricated non-zero default — 0 until Admin enters a real,
      // Ahmed-confirmed figure, same convention as InstallationRate/CablingRate.
      create: { serviceType, minimumChargeAmount: 0, ...input },
      update: input,
    });
    return toRecord(result);
  }
}

function toRecord(r: NonNullable<Awaited<ReturnType<typeof prisma.minimumChargeRule.findUnique>>>): MinimumChargeRuleRecord {
  return {
    id: r.id,
    serviceType: r.serviceType,
    minimumChargeAmount: Number(r.minimumChargeAmount),
  };
}
