import "server-only";
import { prisma } from "@/server/db/client";
import type { CategoryRepository, CategoryRecord, CategoryCreateInput, CategoryUpdateInput } from "@/server/repositories/types";

/** Real, database-backed CategoryRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaCategoryRepository implements CategoryRepository {
  async findById(id: string) {
    const c = await prisma.category.findUnique({ where: { id } });
    return c ? toRecord(c) : null;
  }
  async list() {
    const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
    return rows.map(toRecord);
  }
  async create(input: CategoryCreateInput) {
    return toRecord(await prisma.category.create({ data: input }));
  }
  async update(id: string, input: CategoryUpdateInput) {
    return toRecord(await prisma.category.update({ where: { id }, data: input }));
  }
  async deactivate(id: string) {
    return toRecord(await prisma.category.update({ where: { id }, data: { active: false } }));
  }
}

function toRecord(c: NonNullable<Awaited<ReturnType<typeof prisma.category.findUnique>>>): CategoryRecord {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    sortOrder: c.sortOrder,
    active: c.active,
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
    parentCategoryId: c.parentCategoryId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
