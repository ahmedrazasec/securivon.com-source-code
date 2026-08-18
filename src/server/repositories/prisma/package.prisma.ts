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
    const created = await prisma.package.create({ data: input, include: { items: true } });
    return toRecord(created);
  }
  async update(id: string, input: PackageUpdateInput) {
    const updated = await prisma.package.update({ where: { id }, data: input, include: { items: true } });
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
    items: p.items.map((i) => ({
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
