import "server-only";
import { prisma } from "@/server/db/client";
import type { BrandRepository, BrandRecord, BrandCreateInput, BrandUpdateInput } from "@/server/repositories/types";

/** Real, database-backed BrandRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaBrandRepository implements BrandRepository {
  async findById(id: string) {
    const b = await prisma.brand.findUnique({ where: { id } });
    return b ? toRecord(b) : null;
  }
  async list() {
    return (await prisma.brand.findMany({ orderBy: { name: "asc" } })).map(toRecord);
  }
  async create(input: BrandCreateInput) {
    return toRecord(await prisma.brand.create({ data: input }));
  }
  async update(id: string, input: BrandUpdateInput) {
    return toRecord(await prisma.brand.update({ where: { id }, data: input }));
  }
  async deactivate(id: string) {
    return toRecord(await prisma.brand.update({ where: { id }, data: { active: false } }));
  }
}

function toRecord(b: NonNullable<Awaited<ReturnType<typeof prisma.brand.findUnique>>>): BrandRecord {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl,
    countryOfOrigin: b.countryOfOrigin,
    description: b.description,
    websiteUrl: b.websiteUrl,
    active: b.active,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}
