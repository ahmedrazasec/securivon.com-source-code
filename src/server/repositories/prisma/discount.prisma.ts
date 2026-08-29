import "server-only";
import { prisma } from "@/server/db/client";
import type { DiscountRepository, DiscountRecord, DiscountCreateInput, DiscountUpdateInput } from "@/server/repositories/types";

type DiscountCreateData = Parameters<typeof prisma.discount.create>[0]["data"];
type DiscountUpdateData = Parameters<typeof prisma.discount.update>[0]["data"];

/** Real, database-backed DiscountRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaDiscountRepository implements DiscountRepository {
  async list() {
    return (await prisma.discount.findMany({ orderBy: { createdAt: "desc" } })).map(toRecord);
  }
  async create(input: DiscountCreateInput) {
    const data: DiscountCreateData = {
      ...input,
      validFrom: input.validFrom ? new Date(input.validFrom) : null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
    };
    return toRecord(await prisma.discount.create({ data }));
  }
  async update(id: string, input: DiscountUpdateInput) {
    const data: DiscountUpdateData = {
      ...input,
      validFrom: input.validFrom !== undefined ? (input.validFrom ? new Date(input.validFrom) : null) : undefined,
      validUntil: input.validUntil !== undefined ? (input.validUntil ? new Date(input.validUntil) : null) : undefined,
    };
    return toRecord(await prisma.discount.update({ where: { id }, data }));
  }
  async delete(id: string) {
    await prisma.discount.delete({ where: { id } });
  }
}

function toRecord(r: NonNullable<Awaited<ReturnType<typeof prisma.discount.create>>>): DiscountRecord {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    value: Number(r.value),
    appliesToPackageId: r.appliesToPackageId,
    appliesToCategoryId: r.appliesToCategoryId,
    sitewide: r.sitewide,
    validFrom: r.validFrom?.toISOString() ?? null,
    validUntil: r.validUntil?.toISOString() ?? null,
    active: r.active,
  };
}
