import "server-only";
import { prisma } from "@/server/db/client";
import type { SupplierRepository, SupplierRecord, SupplierCreateInput, SupplierUpdateInput } from "@/server/repositories/types";

/**
 * Real, database-backed SupplierRepository. Excluded from tsconfig — see
 * adminUser.prisma.ts. Supplier records include internal-only fields
 * (notes) by design — this is the Admin-facing repository; the public
 * boundary is enforced separately by src/server/serializers/product.ts's
 * toPublicSupplier, never by this repository omitting data from Admin.
 */
type SupplierCreateData = Parameters<typeof prisma.supplier.create>[0]["data"];
type SupplierUpdateData = Parameters<typeof prisma.supplier.update>[0]["data"];

export class PrismaSupplierRepository implements SupplierRepository {
  async findById(id: string) {
    const s = await prisma.supplier.findFirst({ where: { id, deletedAt: null } });
    return s ? toRecord(s) : null;
  }
  async list() {
    return (await prisma.supplier.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } })).map(toRecord);
  }
  async create(input: SupplierCreateInput) {
    const data: SupplierCreateData = {
      ...input,
      contactInfo: input.contactInfo as SupplierCreateData["contactInfo"],
    };
    return toRecord(await prisma.supplier.create({ data }));
  }
  async update(id: string, input: SupplierUpdateInput) {
    const data: SupplierUpdateData = {
      ...input,
      contactInfo: input.contactInfo !== undefined ? (input.contactInfo as SupplierUpdateData["contactInfo"]) : undefined,
    };
    return toRecord(await prisma.supplier.update({ where: { id }, data }));
  }
  async archive(id: string) {
    return toRecord(await prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } }));
  }
}

function toRecord(s: NonNullable<Awaited<ReturnType<typeof prisma.supplier.findFirst>>>): SupplierRecord {
  return {
    id: s.id,
    name: s.name,
    contactInfo: s.contactInfo,
    tier: s.tier,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
