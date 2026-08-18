import { describe, it, expect } from "vitest";
import { toPublicProduct, toPublicSupplier } from "@/server/serializers/product";
import type { InternalProductRecord, InternalSupplierRecord } from "@/server/serializers/product";

function internalProduct(overrides: Partial<InternalProductRecord> = {}): InternalProductRecord {
  return {
    id: "p1",
    slug: "high-detail-outdoor-camera",
    name: "High-Detail Outdoor Camera",
    sku: "DEMO-SKU-4180T",
    brandId: "b1",
    categoryId: "c1",
    productType: "camera",
    shortDescription: "Sharper detail for entrances and shops.",
    longDescription: null,
    images: [],
    specifications: { bitrateKbps: 4096 },
    useCases: ["Entrances", "Shops"],
    warrantyId: "w1",
    customerPriceType: "STARTING_FROM",
    customerPriceValue: 13500,
    customerPriceValueMax: null,
    installationPriceType: "QUOTE_ONLY",
    installationPriceValue: null,
    installationPriceValueMax: null,
    pricingStatus: "VERIFIED",
    availability: "IN_STOCK",
    configuratorTags: ["outdoor", "tier:high"],
    status: "PUBLISHED",
    supplierCost: 9000,
    sourceUrl: "https://internal-supplier-portal.example/product/9981",
    supplierId: "s1",
    ...overrides,
  };
}

describe("toPublicProduct", () => {
  it("never includes supplierCost in its output", () => {
    const result = toPublicProduct(internalProduct());
    expect(result).not.toHaveProperty("supplierCost");
    expect(JSON.stringify(result)).not.toContain("9000");
  });

  it("never includes sourceUrl in its output", () => {
    const result = toPublicProduct(internalProduct());
    expect(result).not.toHaveProperty("sourceUrl");
    expect(JSON.stringify(result)).not.toContain("internal-supplier-portal");
  });

  it("never includes supplierId in its output", () => {
    const result = toPublicProduct(internalProduct());
    expect(result).not.toHaveProperty("supplierId");
  });

  it("still includes the customer-facing fields needed to render a product", () => {
    const result = toPublicProduct(internalProduct());
    expect(result.name).toBe("High-Detail Outdoor Camera");
    expect(result.customerPriceValue).toBe(13500);
    expect(result.configuratorTags).toContain("outdoor");
  });

  it("strips internal fields even when supplierCost is present but zero (falsy-but-real value)", () => {
    const result = toPublicProduct(internalProduct({ supplierCost: 0 }));
    expect(result).not.toHaveProperty("supplierCost");
  });

  it("passes through the stored price type when pricingStatus is VERIFIED", () => {
    const result = toPublicProduct(internalProduct({ pricingStatus: "VERIFIED", customerPriceType: "FIXED" }));
    expect(result.customerPriceType).toBe("FIXED");
  });

  it("downgrades to QUOTE_ONLY when pricingStatus is NEEDS_REVIEW, even though a real price type is stored", () => {
    const result = toPublicProduct(
      internalProduct({ pricingStatus: "NEEDS_REVIEW", customerPriceType: "STARTING_FROM" })
    );
    expect(result.customerPriceType).toBe("QUOTE_ONLY");
  });

  it("downgrades to QUOTE_ONLY when pricingStatus is STALE", () => {
    const result = toPublicProduct(internalProduct({ pricingStatus: "STALE", customerPriceType: "FIXED" }));
    expect(result.customerPriceType).toBe("QUOTE_ONLY");
  });

  it("never exposes pricingStatus itself in the public output", () => {
    const result = toPublicProduct(internalProduct());
    expect(result).not.toHaveProperty("pricingStatus");
  });
});

describe("toPublicSupplier", () => {
  it("never includes internal notes", () => {
    const internal: InternalSupplierRecord = {
      id: "s1",
      name: "Demo Distributor",
      tier: "STRONG",
      notes: "Negotiated 12% margin on bulk orders — CONFIDENTIAL",
    };
    const result = toPublicSupplier(internal);
    expect(result).not.toHaveProperty("notes");
    expect(JSON.stringify(result)).not.toContain("margin");
  });
});
