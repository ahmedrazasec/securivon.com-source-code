import { describe, it, expect, beforeEach } from "vitest";
import { PackageAdminService } from "@/server/services/packageService";
import { InMemoryPackageRepository, InMemoryPricingAuditLogRepository } from "@test-fakes/repositories";
import type { PackageCreateInput, PackageItemInput } from "@/server/repositories/types";

function basePackageInput(overrides: Partial<PackageCreateInput> = {}): PackageCreateInput {
  return {
    slug: "demo-home-starter",
    name: "DEMO PACKAGE — NOT FOR PRODUCTION",
    targetCustomerDescription: "Small house or apartment",
    category: "HOME_STARTER",
    status: "DRAFT",
    priceType: "QUOTE_ONLY",
    priceValue: null,
    priceValueMax: null,
    ...overrides,
  };
}

function baseItemInput(overrides: Partial<PackageItemInput> = {}): PackageItemInput {
  return {
    productId: "product-1",
    quantity: 2,
    requirement: "REQUIRED",
    inclusionStatus: "INCLUDED",
    priceOverride: null,
    customerFacingDescription: "2x Outdoor entrance camera",
    internalNotes: null,
    displayOrder: 0,
    ...overrides,
  };
}

describe("PackageAdminService", () => {
  let packages: InMemoryPackageRepository;
  let auditLog: InMemoryPricingAuditLogRepository;
  let service: PackageAdminService;

  beforeEach(() => {
    packages = new InMemoryPackageRepository();
    auditLog = new InMemoryPricingAuditLogRepository();
    service = new PackageAdminService(packages, auditLog);
  });

  it("creates a package with no items initially", async () => {
    const pkg = await service.create("admin-1", basePackageInput());
    expect(pkg.items).toEqual([]);
  });

  it("adds an item referencing a product by ID, without duplicating product data", async () => {
    const pkg = await service.create("admin-1", basePackageInput());
    const updated = await service.addItem(pkg.id, baseItemInput({ productId: "product-42" }));
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].productId).toBe("product-42");
    // Confirm the item shape only carries a reference + package-specific
    // fields, not e.g. a "productName" or "productPrice" field.
    expect(Object.keys(updated.items[0]).sort()).toEqual(
      [
        "id",
        "packageId",
        "productId",
        "quantity",
        "requirement",
        "inclusionStatus",
        "priceOverride",
        "customerFacingDescription",
        "internalNotes",
        "displayOrder",
      ].sort()
    );
  });

  it("updates an item's quantity", async () => {
    const pkg = await service.create("admin-1", basePackageInput());
    const withItem = await service.addItem(pkg.id, baseItemInput());
    const itemId = withItem.items[0].id;

    const updated = await service.updateItem(pkg.id, itemId, { quantity: 5 });
    expect(updated.items[0].quantity).toBe(5);
  });

  it("removes an item", async () => {
    const pkg = await service.create("admin-1", basePackageInput());
    const withItem = await service.addItem(pkg.id, baseItemInput());
    const itemId = withItem.items[0].id;

    const updated = await service.removeItem(pkg.id, itemId);
    expect(updated.items).toHaveLength(0);
  });

  it("reorders items and updates displayOrder accordingly", async () => {
    const pkg = await service.create("admin-1", basePackageInput());
    let current = await service.addItem(pkg.id, baseItemInput({ productId: "p1" }));
    current = await service.addItem(pkg.id, baseItemInput({ productId: "p2" }));
    const [first, second] = current.items;

    const reordered = await service.reorderItems(pkg.id, [second.id, first.id]);
    const bySecondFirst = reordered.items.find((i) => i.id === second.id)!;
    const byFirstSecond = reordered.items.find((i) => i.id === first.id)!;
    expect(bySecondFirst.displayOrder).toBe(0);
    expect(byFirstSecond.displayOrder).toBe(1);
  });

  it("distinguishes included / excluded / optional_addon inclusion status", async () => {
    const pkg = await service.create("admin-1", basePackageInput());
    let current = await service.addItem(pkg.id, baseItemInput({ productId: "p1", inclusionStatus: "INCLUDED" }));
    current = await service.addItem(pkg.id, baseItemInput({ productId: "p2", inclusionStatus: "OPTIONAL_ADDON" }));
    const statuses = current.items.map((i) => i.inclusionStatus).sort();
    expect(statuses).toEqual(["INCLUDED", "OPTIONAL_ADDON"]);
  });

  it("archiving a package logs a pricing-relevant audit entry when status changes", async () => {
    const pkg = await service.create("admin-1", basePackageInput({ status: "PUBLISHED" }));
    await service.archive("admin-1", pkg.id);

    const entries = await auditLog.listForEntity("Package", pkg.id);
    const archiveEntry = entries.find((e) => e.action === "ARCHIVE" && e.fieldChanged === "status");
    expect(archiveEntry).toBeDefined();
    expect(archiveEntry?.newValue).toBe("ARCHIVED");
  });
});
