import "server-only";
import type {
  ProductRepository,
  ProductRecord,
  ProductCreateInput,
  ProductUpdateInput,
  PricingAuditLogRepository,
} from "@/server/repositories/types";
import { diffPricingFields } from "@/server/repositories/pricingAudit";

/**
 * Product Admin service.
 *
 * This is where Stage 2's real business rules live — NOT in the API route
 * handlers (which stay thin: auth check, validate input, call this service,
 * return result) and NOT in the repository implementation (which should
 * only know how to persist, not what constitutes a "pricing-relevant"
 * change). Depends on repository INTERFACES only, so it can be exercised in
 * tests with the in-memory fakes (test/fakes/repositories.ts) without a
 * live database — see product.service.test.ts.
 */
export class ProductAdminService {
  constructor(
    private readonly products: ProductRepository,
    private readonly auditLog: PricingAuditLogRepository
  ) {}

  async create(adminUserId: string, input: ProductCreateInput): Promise<ProductRecord> {
    const created = await this.products.create(input);
    await this.writeAudit(adminUserId, "CREATE", created.id, null, created);
    return created;
  }

  async update(adminUserId: string, id: string, input: ProductUpdateInput): Promise<ProductRecord> {
    const before = await this.products.findById(id);
    if (!before) throw new Error(`Product ${id} not found`);
    const after = await this.products.update(id, input);
    await this.writeAudit(adminUserId, "UPDATE", id, before, after);
    return after;
  }

  async archive(adminUserId: string, id: string): Promise<ProductRecord> {
    const before = await this.products.findById(id);
    if (!before) throw new Error(`Product ${id} not found`);
    const after = await this.products.archive(id);
    await this.writeAudit(adminUserId, "ARCHIVE", id, before, after);
    return after;
  }

  async list(filter?: { status?: ProductRecord["status"]; categoryId?: string }) {
    return this.products.list(filter);
  }

  async findById(id: string) {
    return this.products.findById(id);
  }

  async findBySlug(slug: string) {
    return this.products.findBySlug(slug);
  }

  private async writeAudit(
    adminUserId: string,
    action: "CREATE" | "UPDATE" | "ARCHIVE",
    productId: string,
    before: ProductRecord | null,
    after: ProductRecord
  ) {
    const entries = diffPricingFields("Product", productId, adminUserId, action, before, after);
    for (const entry of entries) {
      await this.auditLog.create(entry);
    }
  }
}
