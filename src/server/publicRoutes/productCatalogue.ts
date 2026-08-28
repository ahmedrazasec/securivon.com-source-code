import "server-only";
import { toPublicProduct } from "@/server/serializers/product";
import type { PublicProduct, InternalProductRecord } from "@/server/serializers/product";
import type { ProductRecord, CategoryRepository, BrandRepository, WarrantyRepository } from "@/server/repositories/types";
import type { PriceType } from "@/server/pricing/types";

/**
 * Boundary cast: ProductRecord (src/server/repositories/types.ts) keeps
 * customerPriceType/installationPriceType as plain `string` deliberately
 * (same reasoning as the Prisma repository's own boundary casts in
 * src/server/repositories/prisma/product.prisma.ts) — toPublicProduct's
 * InternalProductRecord wants the narrower PriceType. Narrowing here keeps
 * ProductRecord itself Prisma/enum-free.
 */
function toInternalProductRecord(p: ProductRecord): InternalProductRecord {
  return { ...p, customerPriceType: p.customerPriceType as PriceType, installationPriceType: p.installationPriceType as PriceType };
}

/**
 * Public Product Catalogue data access.
 *
 * This is the ONLY place `/products` and `/products/[slug]` are allowed to
 * pull product data from. It sits at the "server services" layer of the
 * approved architecture (UI -> API/route handlers -> server services ->
 * repositories -> Prisma) — the pages call the container-wired functions at
 * the bottom of this file directly (they are React Server Components, so no
 * HTTP round-trip / API route is needed for a simple read, unlike the
 * stateful Configurator or the Admin dashboard's client-side fetches).
 *
 * Two safety rules are enforced here, not left to the page components:
 *
 *   1. PUBLICATION: only `status === "PUBLISHED"` products are ever
 *      returned. DRAFT and ARCHIVED products are treated exactly like
 *      "not found" from a public caller's perspective — this module never
 *      leaks *why* a product isn't visible.
 *
 *   2. FIELD ALLOWLISTING: every product record is passed through
 *      `toPublicProduct` (src/server/serializers/product.ts) before this
 *      module returns anything. That function already strips
 *      supplierCost/supplierId/sourceUrl and downgrades non-VERIFIED
 *      pricing to QUOTE_ONLY — this module does not duplicate or
 *      second-guess that logic, it just guarantees every code path goes
 *      through it.
 *
 * Brand/Category/Warranty are looked up for display purposes only (name,
 * slug, and a small number of explicitly-safe fields) — never by spreading
 * the full Admin record, since e.g. Category carries `specificationTemplate`
 * (an internal authoring aid) and Warranty/Brand records have no internal
 * fields today but are picked explicitly anyway so a future internal field
 * added to either model doesn't silently reach a public response.
 *
 * TESTABILITY: this file deliberately has NO import of
 * src/server/container.ts (which transitively requires the generated Prisma
 * client — unavailable in this sandbox, see src/server/db/client.ts's
 * header). Every function here takes its repositories as plain parameters
 * instead — same pattern as ProductAdminService
 * (src/server/services/productService.ts) — so tests can exercise the real
 * publication/allowlist rules against test/fakes/repositories.ts in-memory
 * fakes. src/server/publicRoutes/products.ts is the thin, container-wired
 * wrapper around these functions that the Server Component pages actually
 * call; it is not itself unit tested, matching the existing convention for
 * every other container-dependent file in src/server/adminRoutes/ and
 * src/server/publicRoutes/leads.ts.
 *
 * KNOWN LIMITATION (documented, not fixed here — see final report): the
 * Product model has a `deletedAt` column reserved for a future hard-delete
 * audit trail (schema comment), but nothing in the codebase sets it yet —
 * `status: "ARCHIVED"` is the actual soft-delete mechanism in active use,
 * and that IS enforced below. If `deletedAt` is ever wired up by a future
 * batch, this module and the two Prisma repository methods it depends on
 * (`findBySlug`, `findById`) will need a matching filter added.
 */

export interface PublicBrandRef {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  countryOfOrigin: string | null;
}

export interface PublicCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface PublicWarrantyRef {
  id: string;
  name: string;
  durationMonths: number;
  provider: string;
  warrantyType: string | null;
  conditionsText: string | null;
  exclusionsText: string | null;
}

export interface PublicProductListing extends PublicProduct {
  brand: PublicBrandRef | null;
  category: PublicCategoryRef | null;
}

export interface PublicProductDetail extends PublicProductListing {
  warranty: PublicWarrantyRef | null;
}

export interface PublicProductCatalogueFilter {
  categorySlug?: string;
  brandSlug?: string;
}

export interface PublicProductCatalogue {
  products: PublicProductListing[];
  /** Distinct categories among ALL published products (unfiltered) — for building filter pills. */
  availableCategories: PublicCategoryRef[];
  /** Distinct brands among ALL published products (unfiltered) — for building filter pills. */
  availableBrands: PublicBrandRef[];
  /** True if there are zero published products at all (a different empty state than "filter matched nothing"). */
  catalogueIsEmpty: boolean;
}

/**
 * The subset of ProductRepository/ProductAdminService this module needs.
 * `container.products` is a ProductAdminService (list/findBySlug are plain
 * passthroughs to the repository, with create/update/archive layering on
 * audit logging this module never needs) — it satisfies this shape
 * structurally, as does a raw ProductRepository or the in-memory test fake.
 */
export interface PublicProductReader {
  list(filter?: { status?: ProductRecord["status"]; categoryId?: string }): Promise<ProductRecord[]>;
  findBySlug(slug: string): Promise<ProductRecord | null>;
  findById(id: string): Promise<ProductRecord | null>;
}

function toBrandRef(brand: { id: string; name: string; slug: string; logoUrl: string | null; countryOfOrigin: string | null }): PublicBrandRef {
  return { id: brand.id, name: brand.name, slug: brand.slug, logoUrl: brand.logoUrl, countryOfOrigin: brand.countryOfOrigin };
}

function toCategoryRef(category: { id: string; name: string; slug: string }): PublicCategoryRef {
  return { id: category.id, name: category.name, slug: category.slug };
}

function toWarrantyRef(warranty: {
  id: string;
  name: string;
  durationMonths: number;
  provider: string;
  warrantyType: string | null;
  conditionsText: string | null;
  exclusionsText: string | null;
}): PublicWarrantyRef {
  return {
    id: warranty.id,
    name: warranty.name,
    durationMonths: warranty.durationMonths,
    provider: warranty.provider,
    warrantyType: warranty.warrantyType,
    conditionsText: warranty.conditionsText,
    exclusionsText: warranty.exclusionsText,
  };
}

function distinctCategoryRefs(
  products: Array<{ categoryId: string }>,
  categoryById: Map<string, { id: string; name: string; slug: string }>
): PublicCategoryRef[] {
  const seen = new Map<string, PublicCategoryRef>();
  for (const p of products) {
    const c = categoryById.get(p.categoryId);
    if (c && !seen.has(c.id)) seen.set(c.id, toCategoryRef(c));
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function distinctBrandRefs(
  products: Array<{ brandId: string }>,
  brandById: Map<string, { id: string; name: string; slug: string; logoUrl: string | null; countryOfOrigin: string | null }>
): PublicBrandRef[] {
  const seen = new Map<string, PublicBrandRef>();
  for (const p of products) {
    const b = brandById.get(p.brandId);
    if (b && !seen.has(b.id)) seen.set(b.id, toBrandRef(b));
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export interface CatalogueDeps {
  products: PublicProductReader;
  categories: Pick<CategoryRepository, "list">;
  brands: Pick<BrandRepository, "list">;
}

/**
 * Fetches the full public catalogue, optionally filtered by category/brand
 * slug. Filtering by brand happens in-memory after the PUBLISHED list is
 * fetched — ProductRepository.list() only supports filtering by
 * status/categoryId today, and adding a brandId filter at the repository
 * level (touching the interface, every implementation, and every existing
 * caller) is more than this batch's product-catalogue scope calls for. The
 * in-memory approach is a clean, correct fit for a catalogue of the size
 * this business will realistically have.
 */
export async function buildPublicCatalogue(deps: CatalogueDeps, filter: PublicProductCatalogueFilter = {}): Promise<PublicProductCatalogue> {
  const [categories, brands] = await Promise.all([deps.categories.list(), deps.brands.list()]);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  const brandById = new Map(brands.map((b) => [b.id, b]));

  const categoryFilterId = filter.categorySlug ? categoryBySlug.get(filter.categorySlug)?.id : undefined;
  const brandFilterId = filter.brandSlug ? brandBySlug.get(filter.brandSlug)?.id : undefined;

  // If a categorySlug/brandSlug was given but doesn't resolve to a real
  // category/brand, treat it as "matches nothing" rather than silently
  // ignoring the filter — an unrecognized filter value shouldn't quietly
  // fall back to showing the whole catalogue.
  if ((filter.categorySlug && !categoryFilterId) || (filter.brandSlug && !brandFilterId)) {
    const all = await deps.products.list({ status: "PUBLISHED" });
    return {
      products: [],
      availableCategories: distinctCategoryRefs(all, categoryById),
      availableBrands: distinctBrandRefs(all, brandById),
      catalogueIsEmpty: all.length === 0,
    };
  }

  const allPublished = await deps.products.list({ status: "PUBLISHED", categoryId: categoryFilterId });
  const filtered = brandFilterId ? allPublished.filter((p) => p.brandId === brandFilterId) : allPublished;

  // availableCategories/availableBrands are computed from the FULL published
  // set (not `filtered`) so filter pills stay visible/clickable even while
  // another filter is active.
  const fullPublishedSet =
    categoryFilterId || brandFilterId ? await deps.products.list({ status: "PUBLISHED" }) : allPublished;

  const products: PublicProductListing[] = filtered.map((p) => ({
    ...toPublicProduct(toInternalProductRecord(p)),
    brand: brandById.has(p.brandId) ? toBrandRef(brandById.get(p.brandId)!) : null,
    category: categoryById.has(p.categoryId) ? toCategoryRef(categoryById.get(p.categoryId)!) : null,
  }));

  return {
    products,
    availableCategories: distinctCategoryRefs(fullPublishedSet, categoryById),
    availableBrands: distinctBrandRefs(fullPublishedSet, brandById),
    catalogueIsEmpty: fullPublishedSet.length === 0,
  };
}

export interface ProductDetailDeps {
  products: PublicProductReader;
  categories: Pick<CategoryRepository, "findById">;
  brands: Pick<BrandRepository, "findById">;
  warranties: Pick<WarrantyRepository, "findById">;
}

async function resolveProductDetail(deps: ProductDetailDeps, product: ProductRecord): Promise<PublicProductDetail> {
  const [brand, category, warranty] = await Promise.all([
    deps.brands.findById(product.brandId),
    deps.categories.findById(product.categoryId),
    product.warrantyId ? deps.warranties.findById(product.warrantyId) : Promise.resolve(null),
  ]);

  return {
    ...toPublicProduct(toInternalProductRecord(product)),
    brand: brand ? toBrandRef(brand) : null,
    category: category ? toCategoryRef(category) : null,
    warranty: warranty ? toWarrantyRef(warranty) : null,
  };
}

/**
 * Fetches a single product for /products/[slug]. Returns null for:
 *   - no product with that slug
 *   - a product that exists but is DRAFT or ARCHIVED (not publicly visible)
 * Both cases are indistinguishable to the caller by design — the page
 * should render its standard "not found" state either way, never a
 * different message that would confirm a non-public product's existence.
 */
export async function buildPublicProductDetail(deps: ProductDetailDeps, slug: string): Promise<PublicProductDetail | null> {
  const product = await deps.products.findBySlug(slug);
  if (!product || product.status !== "PUBLISHED") return null;
  return resolveProductDetail(deps, product);
}

/**
 * Same as buildPublicProductDetail but by ID rather than slug — used by
 * src/server/publicRoutes/packageCatalogue.ts to resolve PackageItem.productId
 * (and Package.recorderProductId) through this exact same
 * publication/allowlist logic, rather than a package-specific reimplementation.
 * A non-PUBLISHED or nonexistent product resolves to null here too, so a
 * package referencing an unpublished product simply omits that item from
 * its public view instead of leaking it.
 */
export async function buildPublicProductById(deps: ProductDetailDeps, id: string): Promise<PublicProductDetail | null> {
  const product = await deps.products.findById(id);
  if (!product || product.status !== "PUBLISHED") return null;
  return resolveProductDetail(deps, product);
}
