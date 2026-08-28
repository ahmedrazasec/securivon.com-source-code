import { describe, it, expect, beforeEach } from "vitest";
import { buildPublicCatalogue, buildPublicProductDetail } from "@/server/publicRoutes/productCatalogue";
import {
  InMemoryProductRepository,
  InMemoryCategoryRepository,
  InMemoryBrandRepository,
  InMemoryWarrantyRepository,
} from "@test-fakes/repositories";
import type { ProductCreateInput, CategoryCreateInput, BrandCreateInput, WarrantyCreateInput } from "@/server/repositories/types";

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

function baseCategoryInput(overrides: Partial<CategoryCreateInput> = {}): CategoryCreateInput {
  return {
    name: "Cameras",
    slug: "cameras",
    description: null,
    sortOrder: 0,
    active: true,
    seoTitle: null,
    seoDescription: null,
    parentCategoryId: null,
    ...overrides,
  };
}

function baseBrandInput(overrides: Partial<BrandCreateInput> = {}): BrandCreateInput {
  return {
    name: "Demo Brand",
    slug: "demo-brand",
    logoUrl: null,
    countryOfOrigin: null,
    description: null,
    websiteUrl: null,
    active: true,
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

describe("Public Product Catalogue", () => {
  let products: InMemoryProductRepository;
  let categories: InMemoryCategoryRepository;
  let brands: InMemoryBrandRepository;
  let warranties: InMemoryWarrantyRepository;

  beforeEach(() => {
    products = new InMemoryProductRepository();
    categories = new InMemoryCategoryRepository();
    brands = new InMemoryBrandRepository();
    warranties = new InMemoryWarrantyRepository();
  });

  describe("buildPublicCatalogue", () => {
    it("does not return DRAFT products", async () => {
      await products.create(baseProductInput({ slug: "draft-one", status: "DRAFT" }));
      await products.create(baseProductInput({ slug: "published-one", status: "PUBLISHED" }));

      const result = await buildPublicCatalogue({ products, categories, brands });
      expect(result.products.map((p) => p.slug)).toEqual(["published-one"]);
    });

    it("does not return ARCHIVED products", async () => {
      await products.create(baseProductInput({ slug: "archived-one", status: "ARCHIVED" }));
      await products.create(baseProductInput({ slug: "published-one", status: "PUBLISHED" }));

      const result = await buildPublicCatalogue({ products, categories, brands });
      expect(result.products.map((p) => p.slug)).toEqual(["published-one"]);
    });

    it("never includes supplierCost, supplierId, or sourceUrl in any returned product", async () => {
      await products.create(baseProductInput());
      const result = await buildPublicCatalogue({ products, categories, brands });

      expect(result.products).toHaveLength(1);
      const json = JSON.stringify(result.products[0]);
      expect(result.products[0]).not.toHaveProperty("supplierCost");
      expect(result.products[0]).not.toHaveProperty("supplierId");
      expect(result.products[0]).not.toHaveProperty("sourceUrl");
      expect(json).not.toContain("9000");
      expect(json).not.toContain("internal-supplier-portal");
    });

    it("downgrades a PUBLISHED product with unverified pricing to QUOTE_ONLY rather than showing its stored price type", async () => {
      await products.create(
        baseProductInput({ pricingStatus: "NEEDS_REVIEW", customerPriceType: "FIXED", customerPriceValue: 20000 })
      );
      const result = await buildPublicCatalogue({ products, categories, brands });

      expect(result.products[0].customerPriceType).toBe("QUOTE_ONLY");
    });

    it("passes through a VERIFIED product's real price type", async () => {
      await products.create(baseProductInput({ pricingStatus: "VERIFIED", customerPriceType: "FIXED" }));
      const result = await buildPublicCatalogue({ products, categories, brands });

      expect(result.products[0].customerPriceType).toBe("FIXED");
      expect(result.products[0].customerPriceValue).toBe(15000);
    });

    it("resolves brand and category display names for a published product", async () => {
      const category = await categories.create(baseCategoryInput());
      const brand = await brands.create(baseBrandInput());
      await products.create(baseProductInput({ categoryId: category.id, brandId: brand.id }));

      const result = await buildPublicCatalogue({ products, categories, brands });
      expect(result.products[0].category?.name).toBe("Cameras");
      expect(result.products[0].brand?.name).toBe("Demo Brand");
    });

    it("filters by categorySlug using existing category/product relationships", async () => {
      const camerasCategory = await categories.create(baseCategoryInput({ slug: "cameras", name: "Cameras" }));
      const recordersCategory = await categories.create(baseCategoryInput({ slug: "recorders", name: "Recorders" }));
      await products.create(baseProductInput({ slug: "a-camera", categoryId: camerasCategory.id }));
      await products.create(baseProductInput({ slug: "a-recorder", categoryId: recordersCategory.id }));

      const result = await buildPublicCatalogue({ products, categories, brands }, { categorySlug: "recorders" });
      expect(result.products.map((p) => p.slug)).toEqual(["a-recorder"]);
    });

    it("treats an unrecognized category slug as matching nothing rather than returning the whole catalogue", async () => {
      await products.create(baseProductInput());
      const result = await buildPublicCatalogue({ products, categories, brands }, { categorySlug: "does-not-exist" });
      expect(result.products).toHaveLength(0);
    });

    it("reports catalogueIsEmpty=true only when there are zero published products at all", async () => {
      await products.create(baseProductInput({ status: "DRAFT" }));
      const result = await buildPublicCatalogue({ products, categories, brands });
      expect(result.catalogueIsEmpty).toBe(true);
      expect(result.products).toHaveLength(0);
    });

    it("keeps availableCategories/availableBrands populated even when a filter matches nothing, so filter pills stay usable", async () => {
      const category = await categories.create(baseCategoryInput());
      await products.create(baseProductInput({ categoryId: category.id }));

      const result = await buildPublicCatalogue({ products, categories, brands }, { categorySlug: "does-not-exist" });
      expect(result.availableCategories).toHaveLength(1);
      expect(result.catalogueIsEmpty).toBe(false);
    });
  });

  describe("buildPublicProductDetail", () => {
    it("returns a valid PUBLISHED product with its resolved brand/category/warranty", async () => {
      const category = await categories.create(baseCategoryInput());
      const brand = await brands.create(baseBrandInput());
      const warranty = await warranties.create(baseWarrantyInput());
      await products.create(baseProductInput({ slug: "my-camera", categoryId: category.id, brandId: brand.id, warrantyId: warranty.id }));

      const result = await buildPublicProductDetail({ products, categories, brands, warranties }, "my-camera");

      expect(result).not.toBeNull();
      expect(result?.name).toBe("DEMO PRODUCT — NOT FOR PRODUCTION");
      expect(result?.brand?.name).toBe("Demo Brand");
      expect(result?.category?.name).toBe("Cameras");
      expect(result?.warranty?.name).toBe("1-year manufacturer warranty");
    });

    it("returns null for a slug that does not exist, without throwing", async () => {
      const result = await buildPublicProductDetail({ products, categories, brands, warranties }, "no-such-slug");
      expect(result).toBeNull();
    });

    it("returns null for a DRAFT product — does not expose its data", async () => {
      await products.create(baseProductInput({ slug: "draft-product", status: "DRAFT" }));
      const result = await buildPublicProductDetail({ products, categories, brands, warranties }, "draft-product");
      expect(result).toBeNull();
    });

    it("returns null for an ARCHIVED product — does not expose its data", async () => {
      await products.create(baseProductInput({ slug: "archived-product", status: "ARCHIVED" }));
      const result = await buildPublicProductDetail({ products, categories, brands, warranties }, "archived-product");
      expect(result).toBeNull();
    });

    it("never includes supplierCost, supplierId, or sourceUrl for a valid published product", async () => {
      await products.create(baseProductInput({ slug: "my-camera" }));
      const result = await buildPublicProductDetail({ products, categories, brands, warranties }, "my-camera");

      expect(result).not.toBeNull();
      const json = JSON.stringify(result);
      expect(result).not.toHaveProperty("supplierCost");
      expect(result).not.toHaveProperty("supplierId");
      expect(result).not.toHaveProperty("sourceUrl");
      expect(json).not.toContain("9000");
      expect(json).not.toContain("internal-supplier-portal");
    });

    it("downgrades unverified pricing to QUOTE_ONLY on the detail view too", async () => {
      await products.create(baseProductInput({ slug: "stale-price", pricingStatus: "STALE", customerPriceType: "RANGE" }));
      const result = await buildPublicProductDetail({ products, categories, brands, warranties }, "stale-price");
      expect(result?.customerPriceType).toBe("QUOTE_ONLY");
    });

    it("handles a product with no warranty gracefully", async () => {
      await products.create(baseProductInput({ slug: "no-warranty", warrantyId: null }));
      const result = await buildPublicProductDetail({ products, categories, brands, warranties }, "no-warranty");
      expect(result?.warranty).toBeNull();
    });
  });
});
