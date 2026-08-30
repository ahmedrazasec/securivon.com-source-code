import { describe, it, expect } from "vitest";
import { buildProductJsonLd, buildPackageJsonLd, buildServiceJsonLd } from "@/lib/seo/structuredData";
import type { PublicProductDetail } from "@/server/publicRoutes/productCatalogue";
import type { PublicPackageDetail } from "@/server/publicRoutes/packageCatalogue";
import type { PublicServiceDetail } from "@/server/publicRoutes/serviceCatalogue";

function baseProduct(overrides: Partial<PublicProductDetail> = {}): PublicProductDetail {
  return {
    id: "prod-1",
    slug: "dahua-ipc-hfw2431s",
    name: "Dahua IPC-HFW2431S",
    sku: "DH-2431S",
    brandId: "brand-1",
    categoryId: "cat-1",
    productType: "CAMERA",
    shortDescription: "4MP outdoor bullet camera.",
    longDescription: null,
    images: [{ url: "/images/dh-2431s.jpg", alt: "Dahua camera" }],
    specifications: {},
    useCases: [],
    warrantyId: null,
    customerPriceType: "FIXED",
    customerPriceValue: 12500,
    customerPriceValueMax: null,
    installationPriceType: "QUOTE_ONLY",
    installationPriceValue: null,
    installationPriceValueMax: null,
    availability: "IN_STOCK",
    configuratorTags: [],
    brand: { id: "brand-1", name: "Dahua", slug: "dahua", logoUrl: null, countryOfOrigin: null },
    category: { id: "cat-1", name: "Cameras", slug: "cameras" },
    warranty: null,
    ...overrides,
  };
}

function basePackage(overrides: Partial<PublicPackageDetail> = {}): PublicPackageDetail {
  return {
    id: "pkg-1",
    slug: "home-starter-4cam",
    name: "Home Starter — 4 Camera",
    targetCustomerDescription: "A starter CCTV setup for small homes.",
    category: "HOME_STARTER",
    cameraCount: 4,
    cameraTypeSummary: null,
    storageSummary: null,
    priceType: "RANGE",
    priceValue: 80000,
    priceValueMax: 95000,
    itemCount: 5,
    networkingSummary: null,
    cablingAssumptionText: null,
    powerSummary: null,
    installationSummary: null,
    recorder: null,
    warranty: null,
    items: [],
    configuratorPrefillQuery: null,
    ...overrides,
  };
}

describe("buildProductJsonLd — pricing honesty", () => {
  it("emits an Offer with the real fixed price when customerPriceType is FIXED", () => {
    const result = buildProductJsonLd(baseProduct());
    expect(result.offers).toMatchObject({ "@type": "Offer", priceCurrency: "PKR", price: 12500 });
  });

  it("emits an AggregateOffer with lowPrice/highPrice when customerPriceType is RANGE", () => {
    const result = buildProductJsonLd(baseProduct({ customerPriceType: "RANGE", customerPriceValue: 10000, customerPriceValueMax: 15000 }));
    expect(result.offers).toMatchObject({ "@type": "AggregateOffer", lowPrice: 10000, highPrice: 15000 });
  });

  it("never emits an offers block when customerPriceType is QUOTE_ONLY — no fabricated price", () => {
    const result = buildProductJsonLd(baseProduct({ customerPriceType: "QUOTE_ONLY", customerPriceValue: null }));
    expect(result.offers).toBeUndefined();
  });

  it("never emits an offers block when the price type claims a value but the value is actually null", () => {
    // Defends against a data inconsistency (e.g. FIXED with no customerPriceValue set) still not
    // producing a fabricated price — mirrors formatProductPrice()'s own null-guard.
    const result = buildProductJsonLd(baseProduct({ customerPriceType: "FIXED", customerPriceValue: null }));
    expect(result.offers).toBeUndefined();
  });

  it("never emits an AggregateOffer when only one side of a RANGE is present", () => {
    const result = buildProductJsonLd(baseProduct({ customerPriceType: "RANGE", customerPriceValue: 10000, customerPriceValueMax: null }));
    expect(result.offers).toBeUndefined();
  });

  it("maps a real availability enum value to its schema.org URI", () => {
    const result = buildProductJsonLd(baseProduct({ availability: "OUT_OF_STOCK" }));
    expect((result.offers as Record<string, unknown>).availability).toBe("https://schema.org/OutOfStock");
  });

  it("never asserts an availability claim when the underlying value is UNKNOWN", () => {
    const result = buildProductJsonLd(baseProduct({ availability: "UNKNOWN" }));
    expect((result.offers as Record<string, unknown> | undefined)?.availability).toBeUndefined();
  });
});

describe("buildProductJsonLd — field safety", () => {
  it("never includes internal-only fields (supplierCost, supplierId, sourceUrl, internalNotes) — they aren't even on PublicProductDetail", () => {
    const result = buildProductJsonLd(baseProduct());
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/supplierCost|supplierId|sourceUrl|internalNotes/i);
  });

  it("includes brand name when a brand is present", () => {
    const result = buildProductJsonLd(baseProduct());
    expect(result.brand).toEqual({ "@type": "Brand", name: "Dahua" });
  });

  it("omits brand entirely when there is none", () => {
    const result = buildProductJsonLd(baseProduct({ brand: null }));
    expect(result.brand).toBeUndefined();
  });

  it("builds an absolute product URL under the real site origin", () => {
    const result = buildProductJsonLd(baseProduct());
    expect(result.url).toMatch(/^https?:\/\/.+\/products\/dahua-ipc-hfw2431s$/);
  });
});

describe("buildPackageJsonLd", () => {
  it("emits an AggregateOffer for a RANGE-priced verified package", () => {
    const result = buildPackageJsonLd(basePackage());
    expect(result.offers).toMatchObject({ "@type": "AggregateOffer", lowPrice: 80000, highPrice: 95000 });
  });

  it("never emits an offers block for a QUOTE_ONLY package — no fabricated price", () => {
    const result = buildPackageJsonLd(basePackage({ priceType: "QUOTE_ONLY", priceValue: null, priceValueMax: null }));
    expect(result.offers).toBeUndefined();
  });

  it("represents the package as a Product with its real name and slug-based URL", () => {
    const result = buildPackageJsonLd(basePackage());
    expect(result["@type"]).toBe("Product");
    expect(result.name).toBe("Home Starter — 4 Camera");
    expect(result.url).toMatch(/\/packages\/home-starter-4cam$/);
  });
});

describe("buildServiceJsonLd", () => {
  const service: PublicServiceDetail = {
    id: "svc-1",
    slug: "cctv-installation",
    name: "CCTV & IP Camera Installation",
    shortDescription: "Camera selection, placement, and installation for full property coverage.",
    quoteOnly: false,
    problem: "x",
    solution: "y",
    suitableFor: [],
    components: [],
    considerations: "z",
    seoTitle: null,
    seoDescription: null,
  };

  it("builds a Service entry with no offers/price claims at all", () => {
    const result = buildServiceJsonLd(service);
    expect(result["@type"]).toBe("Service");
    expect(result).not.toHaveProperty("offers");
    expect(result.provider).toEqual({ "@type": "Organization", name: "Securivon", url: expect.stringContaining("http") });
  });
});
