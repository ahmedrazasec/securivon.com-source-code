import "server-only";
import type {
  PackageRepository,
  PackageRecord,
  PackageCreateInput,
  PackageUpdateInput,
  PackageItemInput,
  PricingAuditLogRepository,
} from "@/server/repositories/types";
import { diffPricingFields } from "@/server/repositories/pricingAudit";

/**
 * Package Admin service.
 *
 * Package items must reference actual products (Stage 2 §9) — this service
 * does not duplicate product master data; PackageItem only ever stores a
 * productId reference plus package-specific fields (quantity, inclusion
 * status, price override, customer-facing description). Enforcing "the
 * referenced product actually exists" is the API route's job (it should
 * look the product up via ProductRepository before calling addItem) rather
 * than this service's, since that check needs a ProductRepository this
 * service doesn't depend on — kept that way so PackageAdminService doesn't
 * need to know about products beyond an ID string.
 */
export class PackageAdminService {
  constructor(
    private readonly packages: PackageRepository,
    private readonly auditLog: PricingAuditLogRepository
  ) {}

  async create(adminUserId: string, input: PackageCreateInput): Promise<PackageRecord> {
    const created = await this.packages.create(input);
    await this.writeAudit(adminUserId, "CREATE", created.id, null, created);
    return created;
  }

  async update(adminUserId: string, id: string, input: PackageUpdateInput): Promise<PackageRecord> {
    const before = await this.packages.findById(id);
    if (!before) throw new Error(`Package ${id} not found`);
    const after = await this.packages.update(id, input);
    await this.writeAudit(adminUserId, "UPDATE", id, before, after);
    return after;
  }

  async archive(adminUserId: string, id: string): Promise<PackageRecord> {
    const before = await this.packages.findById(id);
    if (!before) throw new Error(`Package ${id} not found`);
    const after = await this.packages.archive(id);
    await this.writeAudit(adminUserId, "ARCHIVE", id, before, after);
    return after;
  }

  async list() {
    return this.packages.list();
  }

  async findById(id: string) {
    return this.packages.findById(id);
  }

  async findBySlug(slug: string) {
    return this.packages.findBySlug(slug);
  }

  async addItem(packageId: string, item: PackageItemInput) {
    return this.packages.addItem(packageId, item);
  }

  async updateItem(packageId: string, itemId: string, item: Partial<PackageItemInput>) {
    return this.packages.updateItem(packageId, itemId, item);
  }

  async removeItem(packageId: string, itemId: string) {
    return this.packages.removeItem(packageId, itemId);
  }

  async reorderItems(packageId: string, orderedItemIds: string[]) {
    return this.packages.reorderItems(packageId, orderedItemIds);
  }

  private async writeAudit(
    adminUserId: string,
    action: "CREATE" | "UPDATE" | "ARCHIVE",
    packageId: string,
    before: PackageRecord | null,
    after: PackageRecord
  ) {
    const entries = diffPricingFields("Package", packageId, adminUserId, action, before, after);
    for (const entry of entries) {
      await this.auditLog.create(entry);
    }
  }
}
