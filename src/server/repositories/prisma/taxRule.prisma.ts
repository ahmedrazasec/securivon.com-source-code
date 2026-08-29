import "server-only";
import { prisma } from "@/server/db/client";
import type { TaxRuleRepository, TaxRuleRecord, TaxRuleCreateInput, TaxRuleUpdateInput } from "@/server/repositories/types";

type TaxRuleCreateData = Parameters<typeof prisma.taxRule.create>[0]["data"];
type TaxRuleUpdateData = Parameters<typeof prisma.taxRule.update>[0]["data"];

/** Real, database-backed TaxRuleRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaTaxRuleRepository implements TaxRuleRepository {
  async list() {
    return (await prisma.taxRule.findMany({ orderBy: { createdAt: "desc" } })).map(toRecord);
  }
  async create(input: TaxRuleCreateInput) {
    const data: TaxRuleCreateData = { ...input };
    return toRecord(await prisma.taxRule.create({ data }));
  }
  async update(id: string, input: TaxRuleUpdateInput) {
    const data: TaxRuleUpdateData = { ...input };
    return toRecord(await prisma.taxRule.update({ where: { id }, data }));
  }
  async delete(id: string) {
    await prisma.taxRule.delete({ where: { id } });
  }
}

function toRecord(r: NonNullable<Awaited<ReturnType<typeof prisma.taxRule.create>>>): TaxRuleRecord {
  return {
    id: r.id,
    name: r.name,
    ratePercentage: Number(r.ratePercentage),
    appliesTo: r.appliesTo,
    inclusiveOrExclusive: r.inclusiveOrExclusive,
    active: r.active,
  };
}
