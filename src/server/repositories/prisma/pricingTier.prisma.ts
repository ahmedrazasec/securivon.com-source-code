import "server-only";
import { prisma } from "@/server/db/client";
import type { PricingTierRepository, PricingTierRecord, PricingTierCreateInput, PricingTierUpdateInput } from "@/server/repositories/types";

type PricingTierCreateData = Parameters<typeof prisma.pricingTier.create>[0]["data"];
type PricingTierUpdateData = Parameters<typeof prisma.pricingTier.update>[0]["data"];

/** Real, database-backed PricingTierRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaPricingTierRepository implements PricingTierRepository {
  async list() {
    return (await prisma.pricingTier.findMany({ orderBy: { serviceType: "asc" } })).map(toRecord);
  }
  async create(input: PricingTierCreateInput) {
    const data: PricingTierCreateData = { ...input, productId: undefined };
    return toRecord(await prisma.pricingTier.create({ data }));
  }
  async update(id: string, input: PricingTierUpdateInput) {
    const data: PricingTierUpdateData = { ...input };
    return toRecord(await prisma.pricingTier.update({ where: { id }, data }));
  }
  async delete(id: string) {
    await prisma.pricingTier.delete({ where: { id } });
  }
}

function toRecord(r: NonNullable<Awaited<ReturnType<typeof prisma.pricingTier.create>>>): PricingTierRecord {
  return {
    id: r.id,
    serviceType: r.serviceType ?? "",
    minQuantity: r.minQuantity,
    maxQuantity: r.maxQuantity,
    unitPrice: Number(r.unitPrice),
    verificationDate: r.verificationDate?.toISOString() ?? null,
  };
}
