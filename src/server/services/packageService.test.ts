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
    cameraCount: 4,
    cameraTypeSummary: "4x 2MP outdoor bullet cameras",
    recorderProductId: null,
    storageSummary: "1TB HDD, ~2 weeks retention",
    networkingSummary: null,
    cablingAssumptionText: null,
    powerSummary: null,
    installationSummary: null,
    warrantyId: null,
    status: "DRAFT",
    priceType: "QUOTE_ONLY",
    priceValue: null,
    priceValueMax: null,
    priceVerificationDate: null,
    configuratorPrefill: null,
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

  it("findBySlug() passes through to the repository", async () => {
    await service.create("admin-1", basePackageInput({ slug: "find-me" }));
    const found = await service.findBySlug("find-me");
    expect(found?.slug).toBe("find-me");
  });

  it("findBySlug() returns null for a slug that does not exist", async () => {
    const found = await service.findBySlug("does-not-exist");
    expect(found).toBeNull();
  });

  it("preserves the newly-surfaced dormant schema fields through create()", async () => {
    const pkg = await service.create(
      "admin-1",
      basePackageInput({
        cameraCount: 6,
        cameraTypeSummary: "6x 4MP outdoor cameras",
        storageSummary: "2TB HDD, ~4 weeks retention",
        networkingSummary: "1x 8-port PoE switch",
        cablingAssumptionText: "Up to 30m Cat6 run per camera",
        powerSummary: "PoE, no separate power supply needed",
        installationSummary: "1-day standard installation",
        priceVerificationDate: "2026-01-01T00:00:00.000Z",
        configuratorPrefill: { propertyType: "shop", cameraCount: 6 },
      })
    );
    expect(pkg.cameraCount).toBe(6);
    expect(pkg.cameraTypeSummary).toBe("6x 4MP outdoor cameras");
    expect(pkg.storageSummary).toBe("2TB HDD, ~4 weeks retention");
    expect(pkg.networkingSummary).toBe("1x 8-port PoE switch");
    expect(pkg.cablingAssumptionText).toBe("Up to 30m Cat6 run per camera");
    expect(pkg.powerSummary).toBe("PoE, no separate power supply needed");
    expect(pkg.installationSummary).toBe("1-day standard installation");
    expect(pkg.priceVerificationDate).toBe("2026-01-01T00:00:00.000Z");
    expect(pkg.configuratorPrefill).toEqual({ propertyType: "shop", cameraCount: 6 });
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
