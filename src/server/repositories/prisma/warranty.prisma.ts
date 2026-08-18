import "server-only";
import { prisma } from "@/server/db/client";
import type { WarrantyRepository, WarrantyRecord, WarrantyCreateInput, WarrantyUpdateInput } from "@/server/repositories/types";

/** Real, database-backed WarrantyRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaWarrantyRepository implements WarrantyRepository {
  async findById(id: string) {
    const w = await prisma.warranty.findUnique({ where: { id } });
    return w ? toRecord(w) : null;
  }
  async list() {
    return (await prisma.warranty.findMany({ orderBy: { name: "asc" } })).map(toRecord);
  }
  async create(input: WarrantyCreateInput) {
    return toRecord(await prisma.warranty.create({ data: input }));
  }
  async update(id: string, input: WarrantyUpdateInput) {
    return toRecord(await prisma.warranty.update({ where: { id }, data: input }));
  }
  async deactivate(id: string) {
    return toRecord(await prisma.warranty.update({ where: { id }, data: { active: false } }));
  }
}

function toRecord(w: NonNullable<Awaited<ReturnType<typeof prisma.warranty.findUnique>>>): WarrantyRecord {
  return {
    id: w.id,
    name: w.name,
    durationMonths: w.durationMonths,
    provider: w.provider,
    warrantyType: w.warrantyType,
    conditionsText: w.conditionsText,
    exclusionsText: w.exclusionsText,
    active: w.active,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}
