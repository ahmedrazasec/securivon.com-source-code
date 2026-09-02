import { describe, it, expect, beforeEach } from "vitest";
import {
  buildPublicPackageCatalogue,
  buildPublicPackageDetail,
  resolveEffectivePackagePriceType,
  buildConfiguratorPrefillQuery,
  resolveValidatedSourcePackageId,
} from "@/server/publicRoutes/packageCatalogue";
import {
  InMemoryProductRepository,
  InMemoryCategoryRepository,
  InMemoryBrandRepository,
  InMemoryWarrantyRepository,
  InMemoryPackageRepository,
} from "@test-fakes/repositories";
import type { ProductCreateInput, PackageCreateInput, PackageItemInput, WarrantyCreateInput } from "@/server/repositories/types";

function baseProductInput(overrides: Partial<ProductCreateInput> = {}): ProductCreateInput {
  return {
    slug: "demo-camera",
    name: "DEMO PRODUCT — NOT FOR PRODUCTION",
    sku: "DEMO-SKU-1",
    brandId: "brand-1",
    categoryId: "cat-1",
    productType: "camera",
    shortDescription: "A demo camera.",
    longDescription: null,
    images: null,
    specifications: null,
    useCases: [],
    warrantyId: null,
    supplierId: "supplier-1",
    supplierCost: 9000,
    customerPriceType: "FIXED",
    customerPriceValue: 15000,
    customerPriceValueMax: null,
    installationPriceType: "QUOTE_ONLY",
    installationPriceValue: null,
    installationPriceValueMax: null,
    pricingStatus: "VERIFIED",
    priceEffectiveDate: null,
    priceReviewDueDate: null,
    availability: "IN_STOCK",
    verificationDate: null,
    sourceUrl: "https://internal-supplier-portal.example/product/9981",
    configuratorTags: [],
    status: "PUBLISHED",
    ...overrides,
  };
}

function basePackageInput(overrides: Partial<PackageCreateInput> = {}): PackageCreateInput {
  return {
    slug: "demo-package",
    name: "DEMO PACKAGE — NOT FOR PRODUCTION",
    targetCustomerDescription: "Small shop",
    category: "SHOP_RETAIL",
    images: null,
    cameraCount: 4,
    cameraTypeSummary: "4x 2MP outdoor bullet cameras",
    recorderProductId: null,
    storageSummary: "1TB HDD",
    networkingSummary: null,
    cablingAssumptionText: null,
    powerSummary: null,
    installationSummary: null,
    warrantyId: null,
    status: "PUBLISHED",
    priceType: "FIXED",
    priceValue: 60000,
    priceValueMax: null,
    priceVerificationDate: "2026-01-01T00:00:00.000Z",
    configuratorPrefill: null,
    ...overrides,
  };
}

function baseItemInput(overrides: Partial<PackageItemInput> = {}): PackageItemInput {
  return {
    productId: "product-1",
    quantity: 4,
    requirement: "REQUIRED",
    inclusionStatus: "INCLUDED",
    priceOverride: null,
    customerFacingDescription: "4x entrance camera",
    internalNotes: "Internal note — must never leak.",
    displayOrder: 0,
    ...overrides,
  };
}

function baseWarrantyInput(overrides: Partial<WarrantyCreateInput> = {}): WarrantyCreateInput {
  return {
    name: "1-year manufacturer warranty",
    durationMonths: 12,
    provider: "MANUFACTURER",
    warrantyType: "Standard",
    conditionsText: "Covers manufacturing defects.",
    exclusionsText: "Excludes physical damage.",
    active: true,
    ...overrides,
  };
}

describe("resolveEffectivePackagePriceType", () => {
  it("downgrades to QUOTE_ONLY when priceVerificationDate is null", () => {
    expect(resolveEffectivePackagePriceType("FIXED", null)).toBe("QUOTE_ONLY");
  });

  it("trusts the stored priceType when priceVerificationDate is set", () => {
    expect(resolveEffectivePackagePriceType("RANGE", "2026-01-01T00:00:00.000Z")).toBe("RANGE");
  });
});

describe("buildConfiguratorPrefillQuery", () => {
  it("returns null for null/missing prefill", () => {
    expect(buildConfiguratorPrefillQuery(null)).toBeNull();
    expect(buildConfiguratorPrefillQuery(undefined)).toBeNull();
  });

  it("returns null for malformed/invalid prefill rather than throwing", () => {
    expect(buildConfiguratorPrefillQuery({ propertyType: "not-a-real-type" })).toBeNull();
    expect(buildConfiguratorPrefillQuery({ unknownField: "smuggled-value" })).toBeNull();
    expect(buildConfiguratorPrefillQuery("just a string")).toBeNull();
  });

  it("builds a query string from a valid partial prefill", () => {
    const query = buildConfiguratorPrefillQuery({ propertyType: "shop", cameraCount: 6, wantsRemoteViewSetup: true });
    expect(query).not.toBeNull();
    const params = new URLSearchParams(query!);
    expect(params.get("propertyType")).toBe("shop");
    expect(params.get("cameraCount")).toBe("6");
    expect(params.get("wantsRemoteViewSetup")).toBe("true");
  });

  it("encodes array fields as repeated params", () => {
    const query = buildConfiguratorPrefillQuery({ optionalServiceIds: ["fire", "intrusion"] });
    const params = new URLSearchParams(query!);
    expect(params.getAll("optionalServiceIds")).toEqual(["fire", "intrusion"]);
  });
});

describe("Public Package Catalogue", () => {
  let products: InMemoryProductRepository;
  let categories: InMemoryCategoryRepository;
  let brands: InMemoryBrandRepository;
  let warranties: InMemoryWarrantyRepository;
  let packages: InMemoryPackageRepository;

  beforeEach(() => {
    products = new InMemoryProductRepository();
    categories = new InMemoryCategoryRepository();
    brands = new InMemoryBrandRepository();
    warranties = new InMemoryWarrantyRepository();
    packages = new InMemoryPackageRepository();
  });

  describe("buildPublicPackageCatalogue", () => {
    it("does not return DRAFT packages", async () => {
      await packages.create(basePackageInput({ slug: "draft-one", status: "DRAFT" }));
      await packages.create(basePackageInput({ slug: "published-one", status: "PUBLISHED" }));

      const result = await buildPublicPackageCatalogue({ packages });
      expect(result.map((p) => p.slug)).toEqual(["published-one"]);
    });

    it("does not return ARCHIVED packages", async () => {
      await packages.create(basePackageInput({ slug: "archived-one", status: "ARCHIVED" }));
      await packages.create(basePackageInput({ slug: "published-one", status: "PUBLISHED" }));

      const result = await buildPublicPackageCatalogue({ packages });
      expect(result.map((p) => p.slug)).toEqual(["published-one"]);
    });

    it("downgrades a PUBLISHED package's price to QUOTE_ONLY when priceVerificationDate is null", async () => {
      await packages.create(basePackageInput({ priceVerificationDate: null, priceType: "FIXED" }));
      const result = await buildPublicPackageCatalogue({ packages });
      expect(result[0].priceType).toBe("QUOTE_ONLY");
    });

    it("passes through a verified package's real price type", async () => {
      await packages.create(basePackageInput({ priceVerificationDate: "2026-01-01T00:00:00.000Z", priceType: "FIXED" }));
      const result = await buildPublicPackageCatalogue({ packages });
      expect(result[0].priceType).toBe("FIXED");
      expect(result[0].priceValue).toBe(60000);
    });

    it("does not include internal-only PackageItem fields (internalNotes) in the response shape", async () => {
      const pkg = await packages.create(basePackageInput());
      await packages.addItem(pkg.id, baseItemInput());

      const result = await buildPublicPackageCatalogue({ packages });
      const json = JSON.stringify(result);
      expect(json).not.toContain("Internal note");
      // Listing view doesn't even include items, only a count — belt-and-braces check:
      expect(result[0]).not.toHaveProperty("items");
    });
  });

  describe("buildPublicPackageDetail", () => {
    it("returns a valid PUBLISHED package with resolved items, recorder, and warranty", async () => {
      const recorder = await products.create(baseProductInput({ slug: "recorder-1", name: "8-Channel NVR" }));
      const camera = await products.create(baseProductInput({ slug: "camera-1", name: "Entrance Camera" }));
      const warranty = await warranties.create(baseWarrantyInput());
      const pkg = await packages.create(
        basePackageInput({ slug: "my-package", recorderProductId: recorder.id, warrantyId: warranty.id })
      );
      await packages.addItem(pkg.id, baseItemInput({ productId: camera.id }));

      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "my-package");

      expect(result).not.toBeNull();
      expect(result?.recorder?.name).toBe("8-Channel NVR");
      expect(result?.warranty?.name).toBe("1-year manufacturer warranty");
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].product.name).toBe("Entrance Camera");
    });

    it("returns null for a slug that does not exist", async () => {
      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "no-such-slug");
      expect(result).toBeNull();
    });

    it("returns null for a DRAFT package", async () => {
      await packages.create(basePackageInput({ slug: "draft-package", status: "DRAFT" }));
      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "draft-package");
      expect(result).toBeNull();
    });

    it("returns null for an ARCHIVED package", async () => {
      await packages.create(basePackageInput({ slug: "archived-package", status: "ARCHIVED" }));
      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "archived-package");
      expect(result).toBeNull();
    });

    it("omits an item whose referenced product is not PUBLISHED, rather than exposing it", async () => {
      const draftProduct = await products.create(baseProductInput({ slug: "draft-camera", status: "DRAFT" }));
      const pkg = await packages.create(basePackageInput({ slug: "pkg-with-draft-item" }));
      await packages.addItem(pkg.id, baseItemInput({ productId: draftProduct.id }));

      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "pkg-with-draft-item");
      expect(result?.items).toHaveLength(0);
    });

    it("omits an item whose productId does not resolve to any product", async () => {
      const pkg = await packages.create(basePackageInput({ slug: "pkg-with-dangling-item" }));
      await packages.addItem(pkg.id, baseItemInput({ productId: "does-not-exist" }));

      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "pkg-with-dangling-item");
      expect(result?.items).toHaveLength(0);
    });

    it("never leaks internalNotes, supplierCost, supplierId, or sourceUrl anywhere in the response", async () => {
      const camera = await products.create(baseProductInput({ slug: "camera-2" }));
      const pkg = await packages.create(basePackageInput({ slug: "leak-check" }));
      await packages.addItem(pkg.id, baseItemInput({ productId: camera.id, internalNotes: "SECRET-INTERNAL-NOTE" }));

      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "leak-check");
      const json = JSON.stringify(result);
      expect(json).not.toContain("SECRET-INTERNAL-NOTE");
      expect(json).not.toContain("9000"); // supplierCost
      expect(json).not.toContain("internal-supplier-portal"); // sourceUrl
      expect(result).not.toHaveProperty("internalNotes");
    });

    it("downgrades unverified package pricing to QUOTE_ONLY on the detail view too", async () => {
      await packages.create(basePackageInput({ slug: "unverified-price", priceVerificationDate: null, priceType: "RANGE" }));
      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "unverified-price");
      expect(result?.priceType).toBe("QUOTE_ONLY");
    });

    it("resolves items in displayOrder", async () => {
      const camA = await products.create(baseProductInput({ slug: "cam-a", name: "Camera A" }));
      const camB = await products.create(baseProductInput({ slug: "cam-b", name: "Camera B" }));
      const pkg = await packages.create(basePackageInput({ slug: "ordered-items" }));
      await packages.addItem(pkg.id, baseItemInput({ productId: camB.id, displayOrder: 1 }));
      await packages.addItem(pkg.id, baseItemInput({ productId: camA.id, displayOrder: 0 }));

      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "ordered-items");
      expect(result?.items.map((i) => i.product.name)).toEqual(["Camera A", "Camera B"]);
    });

    it("sets configuratorPrefillQuery to null when configuratorPrefill is absent", async () => {
      await packages.create(basePackageInput({ slug: "no-prefill", configuratorPrefill: null }));
      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "no-prefill");
      expect(result?.configuratorPrefillQuery).toBeNull();
    });

    it("builds configuratorPrefillQuery from a valid configuratorPrefill", async () => {
      await packages.create(
        basePackageInput({ slug: "with-prefill", configuratorPrefill: { propertyType: "shop", cameraCount: 4 } })
      );
      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "with-prefill");
      expect(result?.configuratorPrefillQuery).toContain("propertyType=shop");
      expect(result?.configuratorPrefillQuery).toContain("cameraCount=4");
    });

    it("handles a package with no recorder and no warranty gracefully", async () => {
      await packages.create(basePackageInput({ slug: "minimal-package", recorderProductId: null, warrantyId: null }));
      const result = await buildPublicPackageDetail({ packages, products, categories, brands, warranties }, "minimal-package");
      expect(result?.recorder).toBeNull();
      expect(result?.warranty).toBeNull();
    });
  });
});

describe("resolveValidatedSourcePackageId", () => {
  let packages: InMemoryPackageRepository;

  beforeEach(() => {
    packages = new InMemoryPackageRepository();
  });

  it("returns the package id for a real, PUBLISHED package", async () => {
    const pkg = await packages.create(basePackageInput({ slug: "published-source", status: "PUBLISHED" }));
    const result = await resolveValidatedSourcePackageId({ packages }, pkg.id);
    expect(result).toBe(pkg.id);
  });

  it("returns null for a nonexistent package id", async () => {
    const result = await resolveValidatedSourcePackageId({ packages }, "does-not-exist");
    expect(result).toBeNull();
  });

  it("returns null for a DRAFT (not yet publicly eligible) package", async () => {
    const pkg = await packages.create(basePackageInput({ slug: "draft-source", status: "DRAFT" }));
    const result = await resolveValidatedSourcePackageId({ packages }, pkg.id);
    expect(result).toBeNull();
  });

  it("returns null for an ARCHIVED (no longer publicly eligible) package", async () => {
    const pkg = await packages.create(basePackageInput({ slug: "archived-source", status: "ARCHIVED" }));
    const result = await resolveValidatedSourcePackageId({ packages }, pkg.id);
    expect(result).toBeNull();
  });

  it("returns null when no candidate id is supplied (normal, package-less Configurator session)", async () => {
    expect(await resolveValidatedSourcePackageId({ packages }, undefined)).toBeNull();
    expect(await resolveValidatedSourcePackageId({ packages }, null)).toBeNull();
    expect(await resolveValidatedSourcePackageId({ packages }, "")).toBeNull();
  });
});
