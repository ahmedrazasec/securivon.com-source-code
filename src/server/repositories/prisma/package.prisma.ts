import "server-only";
import { prisma } from "@/server/db/client";
import type {
  PackageRepository,
  PackageRecord,
  PackageCreateInput,
  PackageUpdateInput,
  PackageItemInput,
} from "@/server/repositories/types";

/**
 * Real, database-backed PackageRepository, including PackageItem
 * management. Excluded from tsconfig — see adminUser.prisma.ts.
 */
type PackageCreateData = Parameters<typeof prisma.package.create>[0]["data"];
type PackageUpdateData = Parameters<typeof prisma.package.update>[0]["data"];

/**
 * Boundary casts below: PackageCreateInput (src/server/repositories/types.ts)
 * is deliberately Prisma-free — `category` and `priceType` are plain
 * `string` there so business logic/tests never depend on generated Prisma
 * types. Prisma's generated client expects its own PackageCategory/
 * PriceType enum types for these two fields specifically (every other
 * field already matches). The route layer's Zod schema
 * (src/server/adminRoutes/*.ts) already validates these against the exact
 * enum members before this repository ever sees them, so narrowing here is
 * safe, not a bypass of validation — just satisfying TypeScript at the one
 * layer that's allowed to know about Prisma's generated types.
 */
export class PrismaPackageRepository implements PackageRepository {
  async findById(id: string) {
    const p = await prisma.package.findUnique({ where: { id }, include: { items: { orderBy: { displayOrder: "asc" } } } });
    return p ? toRecord(p) : null;
  }
  async list() {
    const rows = await prisma.package.findMany({ include: { items: true }, orderBy: { updatedAt: "desc" } });
    return rows.map(toRecord);
  }
  async create(input: PackageCreateInput) {
    const data: PackageCreateData = {
      ...input,
      category: input.category as PackageCreateData["category"],
      priceType: input.priceType as PackageCreateData["priceType"],
    };
    const created = await prisma.package.create({ data, include: { items: true } });
    return toRecord(created);
  }
  async update(id: string, input: PackageUpdateInput) {
    const data: PackageUpdateData = {
      ...input,
      category: input.category !== undefined ? (input.category as PackageUpdateData["category"]) : undefined,
      priceType: input.priceType !== undefined ? (input.priceType as PackageUpdateData["priceType"]) : undefined,
    };
    const updated = await prisma.package.update({ where: { id }, data, include: { items: true } });
    return toRecord(updated);
  }
  async archive(id: string) {
    const updated = await prisma.package.update({ where: { id }, data: { status: "ARCHIVED" }, include: { items: true } });
    return toRecord(updated);
  }
  async addItem(packageId: string, item: PackageItemInput) {
    await prisma.packageItem.create({ data: { ...item, packageId } });
    return (await this.findById(packageId))!;
  }
  async updateItem(packageId: string, itemId: string, item: Partial<PackageItemInput>) {
    await prisma.packageItem.update({ where: { id: itemId }, data: item });
    return (await this.findById(packageId))!;
  }
  async removeItem(packageId: string, itemId: string) {
    await prisma.packageItem.delete({ where: { id: itemId } });
    return (await this.findById(packageId))!;
  }
  async reorderItems(packageId: string, orderedItemIds: string[]) {
    await prisma.$transaction(
      orderedItemIds.map((itemId, index) =>
        prisma.packageItem.update({ where: { id: itemId }, data: { displayOrder: index } })
      )
    );
    return (await this.findById(packageId))!;
  }
}

type PackageWithItems = NonNullable<Awaited<ReturnType<typeof prisma.package.findUnique>>> & {
  items: Awaited<ReturnType<typeof prisma.packageItem.findMany>>;
};

type PackageItemRow = PackageWithItems["items"][number];

function toRecord(p: PackageWithItems): PackageRecord {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    targetCustomerDescription: p.targetCustomerDescription,
    category: p.category,
    status: p.status,
    priceType: p.priceType,
    priceValue: p.priceValue ? Number(p.priceValue) : null,
    priceValueMax: p.priceValueMax ? Number(p.priceValueMax) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    items: p.items.map((i: PackageItemRow) => ({
      id: i.id,
      packageId: i.packageId,
      productId: i.productId,
      quantity: i.quantity,
      requirement: i.requirement,
      inclusionStatus: i.inclusionStatus,
      priceOverride: i.priceOverride ? Number(i.priceOverride) : null,
      customerFacingDescription: i.customerFacingDescription,
      internalNotes: i.internalNotes,
      displayOrder: i.displayOrder,
    })),
  };
}
