import "server-only";
import { prisma } from "@/server/db/client";
import type { ProductRepository, ProductRecord, ProductCreateInput, ProductUpdateInput } from "@/server/repositories/types";

/**
 * Real, database-backed ProductRepository. Excluded from tsconfig — see
 * adminUser.prisma.ts for the full explanation (same reason applies to
 * every file in this directory).
 */
export class PrismaProductRepository implements ProductRepository {
  async findById(id: string): Promise<ProductRecord | null> {
    const p = await prisma.product.findUnique({ where: { id } });
    return p ? toRecord(p) : null;
  }

  async findBySlug(slug: string): Promise<ProductRecord | null> {
    const p = await prisma.product.findUnique({ where: { slug } });
    return p ? toRecord(p) : null;
  }

  async list(filter?: { status?: ProductRecord["status"]; categoryId?: string }): Promise<ProductRecord[]> {
    const rows = await prisma.product.findMany({
      where: {
        deletedAt: null,
        status: filter?.status,
        categoryId: filter?.categoryId,
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toRecord);
  }

  async create(input: ProductCreateInput): Promise<ProductRecord> {
    const created = await prisma.product.create({ data: input });
    return toRecord(created);
  }

  async update(id: string, input: ProductUpdateInput): Promise<ProductRecord> {
    const updated = await prisma.product.update({ where: { id }, data: input });
    return toRecord(updated);
  }

  async archive(id: string): Promise<ProductRecord> {
    const updated = await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    return toRecord(updated);
  }
}

// Maps Prisma's generated row shape (Decimal objects, Date objects) onto
// the plain-JSON-friendly ProductRecord shape the service layer expects.
function toRecord(p: NonNullable<Awaited<ReturnType<typeof prisma.product.findUnique>>>): ProductRecord {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    brandId: p.brandId,
    categoryId: p.categoryId,
    productType: p.productType,
    shortDescription: p.shortDescription,
    longDescription: p.longDescription,
    images: p.images,
    specifications: p.specifications,
    useCases: p.useCases,
    warrantyId: p.warrantyId,
    supplierId: p.supplierId,
    supplierCost: p.supplierCost ? Number(p.supplierCost) : null,
    customerPriceType: p.customerPriceType,
    customerPriceValue: p.customerPriceValue ? Number(p.customerPriceValue) : null,
    customerPriceValueMax: p.customerPriceValueMax ? Number(p.customerPriceValueMax) : null,
    installationPriceType: p.installationPriceType,
    installationPriceValue: p.installationPriceValue ? Number(p.installationPriceValue) : null,
    installationPriceValueMax: p.installationPriceValueMax ? Number(p.installationPriceValueMax) : null,
    pricingStatus: p.pricingStatus,
    priceEffectiveDate: p.priceEffectiveDate?.toISOString() ?? null,
    priceReviewDueDate: p.priceReviewDueDate?.toISOString() ?? null,
    availability: p.availability,
    verificationDate: p.verificationDate?.toISOString() ?? null,
    sourceUrl: p.sourceUrl,
    configuratorTags: p.configuratorTags,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
