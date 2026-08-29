/**
 * TEST-ONLY in-memory repository fakes.
 *
 * These are NOT a production persistence layer and must never be wired into
 * any API route or the app's real repository factory — they exist solely so
 * unit tests can exercise repository-contract business logic (archiving,
 * package/item relationships, audit-log creation on mutation) without a
 * live database, which is unavailable in this sandbox (see README "Known
 * limitations"). The real implementations live in
 * src/server/repositories/prisma/*.ts, excluded from this project's
 * typecheck/build for the same reason and NOT exercised by these tests.
 *
 * Living under /test rather than /src specifically so it's obvious this
 * directory never ships to production.
 */
import { randomUUID } from "node:crypto";
import type {
  ProductRepository,
  ProductRecord,
  ProductCreateInput,
  ProductUpdateInput,
  SupplierRepository,
  SupplierRecord,
  SupplierCreateInput,
  SupplierUpdateInput,
  PackageRepository,
  PackageRecord,
  PackageCreateInput,
  PackageUpdateInput,
  PackageItemInput,
  InstallationRateRepository,
  InstallationRateRecord,
  InstallationRateUpdateInput,
  PricingAuditLogRepository,
  PricingAuditLogRecord,
  PricingAuditLogCreateInput,
  WarrantyRepository,
  WarrantyRecord,
  WarrantyCreateInput,
  WarrantyUpdateInput,
  CategoryRepository,
  CategoryRecord,
  CategoryCreateInput,
  CategoryUpdateInput,
  BrandRepository,
  BrandRecord,
  BrandCreateInput,
  BrandUpdateInput,
  PricingTierRepository,
  PricingTierRecord,
  PricingTierCreateInput,
  PricingTierUpdateInput,
  CablingRateRepository,
  CablingRateRecord,
  CablingRateUpdateInput,
  RoundingRuleRepository,
  RoundingRuleRecord,
  RoundingRuleUpdateInput,
  DiscountRepository,
  DiscountRecord,
  DiscountCreateInput,
  DiscountUpdateInput,
  TaxRuleRepository,
  TaxRuleRecord,
  TaxRuleCreateInput,
  TaxRuleUpdateInput,
  MinimumChargeRuleRepository,
  MinimumChargeRuleRecord,
  MinimumChargeRuleUpdateInput,
} from "@/server/repositories/types";

export class InMemoryProductRepository implements ProductRepository {
  private records = new Map<string, ProductRecord>();

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }
  async findBySlug(slug: string) {
    return [...this.records.values()].find((r) => r.slug === slug) ?? null;
  }
  async list(filter?: { status?: ProductRecord["status"]; categoryId?: string }) {
    return [...this.records.values()].filter(
      (r) =>
        (!filter?.status || r.status === filter.status) &&
        (!filter?.categoryId || r.categoryId === filter.categoryId)
    );
  }
  async create(input: ProductCreateInput) {
    const now = new Date().toISOString();
    const record: ProductRecord = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }
  async update(id: string, input: ProductUpdateInput) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Product ${id} not found`);
    const updated: ProductRecord = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.records.set(id, updated);
    return updated;
  }
  async archive(id: string) {
    return this.update(id, { status: "ARCHIVED" });
  }
}

export class InMemorySupplierRepository implements SupplierRepository {
  private records = new Map<string, SupplierRecord>();

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }
  async list() {
    return [...this.records.values()];
  }
  async create(input: SupplierCreateInput) {
    const now = new Date().toISOString();
    const record: SupplierRecord = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }
  async update(id: string, input: SupplierUpdateInput) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Supplier ${id} not found`);
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.records.set(id, updated);
    return updated;
  }
  async archive(id: string) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Supplier ${id} not found`);
    // Suppliers don't have a status field in the interface — "archive" here
    // is a placeholder no-op returning the record unchanged; real archiving
    // for suppliers uses Prisma's deletedAt soft-delete column, not modeled
    // in this simplified test fake.
    return existing;
  }
}

export class InMemoryWarrantyRepository implements WarrantyRepository {
  private records = new Map<string, WarrantyRecord>();

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }
  async list() {
    return [...this.records.values()];
  }
  async create(input: WarrantyCreateInput) {
    const now = new Date().toISOString();
    const record: WarrantyRecord = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }
  async update(id: string, input: WarrantyUpdateInput) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Warranty ${id} not found`);
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.records.set(id, updated);
    return updated;
  }
  async deactivate(id: string) {
    return this.update(id, { active: false });
  }
}

export class InMemoryCategoryRepository implements CategoryRepository {
  private records = new Map<string, CategoryRecord>();

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }
  async list() {
    return [...this.records.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async create(input: CategoryCreateInput) {
    const now = new Date().toISOString();
    const record: CategoryRecord = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }
  async update(id: string, input: CategoryUpdateInput) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Category ${id} not found`);
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.records.set(id, updated);
    return updated;
  }
  async deactivate(id: string) {
    return this.update(id, { active: false });
  }
}

export class InMemoryBrandRepository implements BrandRepository {
  private records = new Map<string, BrandRecord>();

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }
  async list() {
    return [...this.records.values()];
  }
  async create(input: BrandCreateInput) {
    const now = new Date().toISOString();
    const record: BrandRecord = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }
  async update(id: string, input: BrandUpdateInput) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Brand ${id} not found`);
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.records.set(id, updated);
    return updated;
  }
  async deactivate(id: string) {
    return this.update(id, { active: false });
  }
}

export class InMemoryPackageRepository implements PackageRepository {
  private records = new Map<string, PackageRecord>();

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }
  async findBySlug(slug: string) {
    return [...this.records.values()].find((p) => p.slug === slug) ?? null;
  }
  async list() {
    return [...this.records.values()];
  }
  async create(input: PackageCreateInput) {
    const now = new Date().toISOString();
    const record: PackageRecord = { ...input, id: randomUUID(), createdAt: now, updatedAt: now, items: [] };
    this.records.set(record.id, record);
    return record;
  }
  async update(id: string, input: PackageUpdateInput) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Package ${id} not found`);
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.records.set(id, updated);
    return updated;
  }
  async archive(id: string) {
    return this.update(id, { status: "ARCHIVED" });
  }
  async addItem(packageId: string, item: PackageItemInput) {
    const pkg = this.records.get(packageId);
    if (!pkg) throw new Error(`Package ${packageId} not found`);
    pkg.items.push({ ...item, id: randomUUID(), packageId });
    pkg.updatedAt = new Date().toISOString();
    return pkg;
  }
  async updateItem(packageId: string, itemId: string, item: Partial<PackageItemInput>) {
    const pkg = this.records.get(packageId);
    if (!pkg) throw new Error(`Package ${packageId} not found`);
    const idx = pkg.items.findIndex((i) => i.id === itemId);
    if (idx === -1) throw new Error(`Package item ${itemId} not found`);
    pkg.items[idx] = { ...pkg.items[idx], ...item };
    pkg.updatedAt = new Date().toISOString();
    return pkg;
  }
  async removeItem(packageId: string, itemId: string) {
    const pkg = this.records.get(packageId);
    if (!pkg) throw new Error(`Package ${packageId} not found`);
    pkg.items = pkg.items.filter((i) => i.id !== itemId);
    pkg.updatedAt = new Date().toISOString();
    return pkg;
  }
  async reorderItems(packageId: string, orderedItemIds: string[]) {
    const pkg = this.records.get(packageId);
    if (!pkg) throw new Error(`Package ${packageId} not found`);
    orderedItemIds.forEach((itemId, index) => {
      const item = pkg.items.find((i) => i.id === itemId);
      if (item) item.displayOrder = index;
    });
    pkg.updatedAt = new Date().toISOString();
    return pkg;
  }
}

export class InMemoryInstallationRateRepository implements InstallationRateRepository {
  private records = new Map<string, InstallationRateRecord>();

  async findByServiceType(serviceType: InstallationRateRecord["serviceType"]) {
    return [...this.records.values()].find((r) => r.serviceType === serviceType) ?? null;
  }
  async list() {
    return [...this.records.values()];
  }
  async upsert(serviceType: InstallationRateRecord["serviceType"], input: InstallationRateUpdateInput) {
    const existing = [...this.records.values()].find((r) => r.serviceType === serviceType);
    if (existing) {
      const updated = { ...existing, ...input };
      this.records.set(existing.id, updated);
      return updated;
    }
    const record: InstallationRateRecord = {
      id: randomUUID(),
      serviceType,
      baseRatePerUnit: 0,
      floorModifier: 0,
      heightAccessModifier: 0,
      conduitTrunkingModifier: 0,
      existingVsNewCablingModifier: 0,
      configurationFee: 0,
      remoteViewSetupFee: 0,
      minimumCharge: 0,
      verificationDate: null,
      ...input,
    };
    this.records.set(record.id, record);
    return record;
  }
}

export class InMemoryPricingAuditLogRepository implements PricingAuditLogRepository {
  private records: PricingAuditLogRecord[] = [];

  async create(input: PricingAuditLogCreateInput) {
    const record: PricingAuditLogRecord = { ...input, id: randomUUID(), changedAt: new Date().toISOString() };
    this.records.push(record);
    return record;
  }
  async listForEntity(entityType: string, entityId: string) {
    return this.records.filter((r) => r.entityType === entityType && r.entityId === entityId);
  }
  async listRecent(limit = 50) {
    return [...this.records].sort((a, b) => b.changedAt.localeCompare(a.changedAt)).slice(0, limit);
  }
}

export class InMemoryPricingTierRepository implements PricingTierRepository {
  private records = new Map<string, PricingTierRecord>();

  async list() {
    return [...this.records.values()];
  }
  async create(input: PricingTierCreateInput) {
    const record: PricingTierRecord = { id: randomUUID(), ...input };
    this.records.set(record.id, record);
    return record;
  }
  async update(id: string, input: PricingTierUpdateInput) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`PricingTier ${id} not found`);
    const updated = { ...existing, ...input };
    this.records.set(id, updated);
    return updated;
  }
  async delete(id: string) {
    this.records.delete(id);
  }
}

export class InMemoryCablingRateRepository implements CablingRateRepository {
  private record: CablingRateRecord | null = null;

  async getCurrent() {
    return this.record;
  }
  async upsert(input: CablingRateUpdateInput) {
    this.record = this.record
      ? { ...this.record, ...input }
      : { id: randomUUID(), cableType: "", ratePerMeter: 0, includedAllowancePerCamera: 0, verificationDate: null, ...input };
    return this.record;
  }
}

export class InMemoryRoundingRuleRepository implements RoundingRuleRepository {
  private record: RoundingRuleRecord | null = null;

  async getCurrent() {
    return this.record;
  }
  async upsert(input: RoundingRuleUpdateInput) {
    this.record = this.record ? { ...this.record, ...input } : { id: randomUUID(), granularity: 500, direction: "NEAREST", ...input };
    return this.record;
  }
}

export class InMemoryDiscountRepository implements DiscountRepository {
  private records = new Map<string, DiscountRecord>();

  async list() {
    return [...this.records.values()];
  }
  async create(input: DiscountCreateInput) {
    const record: DiscountRecord = { id: randomUUID(), ...input };
    this.records.set(record.id, record);
    return record;
  }
  async update(id: string, input: DiscountUpdateInput) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Discount ${id} not found`);
    const updated = { ...existing, ...input };
    this.records.set(id, updated);
    return updated;
  }
  async delete(id: string) {
    this.records.delete(id);
  }
}

export class InMemoryTaxRuleRepository implements TaxRuleRepository {
  private records = new Map<string, TaxRuleRecord>();

  async list() {
    return [...this.records.values()];
  }
  async create(input: TaxRuleCreateInput) {
    const record: TaxRuleRecord = { id: randomUUID(), ...input };
    this.records.set(record.id, record);
    return record;
  }
  async update(id: string, input: TaxRuleUpdateInput) {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`TaxRule ${id} not found`);
    const updated = { ...existing, ...input };
    this.records.set(id, updated);
    return updated;
  }
  async delete(id: string) {
    this.records.delete(id);
  }
}

export class InMemoryMinimumChargeRuleRepository implements MinimumChargeRuleRepository {
  private records = new Map<string, MinimumChargeRuleRecord>();

  async list() {
    return [...this.records.values()];
  }
  async findByServiceType(serviceType: string) {
    return [...this.records.values()].find((r) => r.serviceType === serviceType) ?? null;
  }
  async upsert(serviceType: string, input: MinimumChargeRuleUpdateInput) {
    const existing = [...this.records.values()].find((r) => r.serviceType === serviceType);
    if (existing) {
      const updated = { ...existing, ...input };
      this.records.set(existing.id, updated);
      return updated;
    }
    // Never a fabricated non-zero default — 0 until Admin enters a real figure, same convention as the Prisma repo.
    const record: MinimumChargeRuleRecord = { id: randomUUID(), serviceType, minimumChargeAmount: 0, ...input };
    this.records.set(record.id, record);
    return record;
  }
}
