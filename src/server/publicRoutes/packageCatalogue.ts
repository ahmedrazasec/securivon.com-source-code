import "server-only";
import { configuratorPrefillSchema } from "@/server/validation/schemas";
import {
  buildPublicProductById,
  type ProductDetailDeps,
  type PublicProductDetail,
  type PublicWarrantyRef,
} from "@/server/publicRoutes/productCatalogue";
import type { PackageRecord, PackageItemRecord, WarrantyRepository } from "@/server/repositories/types";

/**
 * Public Package Catalogue data access.
 *
 * Same architecture and safety rules as
 * src/server/publicRoutes/productCatalogue.ts — read that file's header
 * first, this one only documents what's different for Package:
 *
 *   1. PUBLICATION: only `status === "PUBLISHED"` packages are returned.
 *      Same DRAFT/ARCHIVED → "not found" rule as Product.
 *
 *   2. PRICING HONESTY — DIFFERENT MECHANISM THAN PRODUCT: Package has no
 *      `pricingStatus` enum (VERIFIED/NEEDS_REVIEW/STALE) the way Product
 *      does — the schema only gives it `priceVerificationDate` (nullable).
 *      So the rule here is: a package's stored `priceType` is only trusted
 *      when `priceVerificationDate` is set; otherwise it's downgraded to
 *      QUOTE_ONLY, same end result as Product's rule, different input.
 *      This is `resolveEffectivePackagePriceType` below — it does NOT call
 *      src/server/pricing/pricingStatus.ts's resolveEffectivePriceType,
 *      because that function's signature expects Product's
 *      PricingStatusValue enum, which Package simply doesn't have.
 *
 *   3. ITEM → PRODUCT RESOLUTION REUSES PRODUCT'S OWN PUBLIC ARCHITECTURE:
 *      PackageItem only stores a productId reference (never duplicates
 *      product data — see src/server/services/packageService.ts's header).
 *      Every item (and Package.recorderProductId) is resolved through
 *      productCatalogue.ts's `buildPublicProductById`, so a package can
 *      never expose more about a product than the Products page itself
 *      would. A package item referencing a product that isn't currently
 *      PUBLISHED is simply omitted from the public view — never rendered
 *      with partial/stale data.
 *
 *   4. CONFIGURATOR PREFILL: Package.configuratorPrefill is admin-authored
 *      JSON (Prisma `Json?` — arbitrary at the type level). It is
 *      validated against `configuratorPrefillSchema`
 *      (src/server/validation/schemas.ts) before ever being used —
 *      invalid/malformed JSON silently resolves to no prefill (the
 *      "Configure This Package" CTA still works, just links to a blank
 *      Configurator) rather than crashing the package detail page or
 *      passing untrusted data into a public URL.
 */

export interface PublicPackageItem {
  id: string;
  quantity: number;
  requirement: "REQUIRED" | "OPTIONAL";
  inclusionStatus: "INCLUDED" | "EXCLUDED" | "OPTIONAL_ADDON";
  customerFacingDescription: string | null;
  displayOrder: number;
  product: PublicProductDetail;
}

export interface PublicPackageListing {
  id: string;
  slug: string;
  name: string;
  targetCustomerDescription: string | null;
  category: string;
  cameraCount: number | null;
  cameraTypeSummary: string | null;
  storageSummary: string | null;
  /** Already downgraded to QUOTE_ONLY if priceVerificationDate isn't set — see module header. */
  priceType: string;
  priceValue: number | null;
  priceValueMax: number | null;
  itemCount: number;
}

export interface PublicPackageDetail extends PublicPackageListing {
  networkingSummary: string | null;
  cablingAssumptionText: string | null;
  powerSummary: string | null;
  installationSummary: string | null;
  recorder: PublicProductDetail | null;
  warranty: PublicWarrantyRef | null;
  items: PublicPackageItem[];
  /**
   * Pre-built, already-validated URL query string (no leading "?") for the
   * "Configure This Package" CTA — e.g. "propertyType=shop&cameraCount=6".
   * Null when the package has no (valid) configuratorPrefill, in which
   * case the CTA should link to a plain, unprefilled /configurator.
   */
  configuratorPrefillQuery: string | null;
}

/** Downgrades to QUOTE_ONLY unless the package price has an explicit verification date — see module header. */
export function resolveEffectivePackagePriceType(storedPriceType: string, priceVerificationDate: string | null): string {
  if (!priceVerificationDate) return "QUOTE_ONLY";
  return storedPriceType;
}

/**
 * Turns validated configuratorPrefill JSON into a URL query string the
 * Configurator page (src/app/(public)/configurator/page.tsx) reads on
 * mount. Booleans/numbers/arrays are stringified plainly — the
 * Configurator's own parsing is defensive about malformed values already
 * (see that file), so this only needs to produce well-formed pairs, not
 * guard against the Configurator misreading them.
 */
export function buildConfiguratorPrefillQuery(rawPrefill: unknown): string | null {
  const parsed = configuratorPrefillSchema.safeParse(rawPrefill);
  if (!parsed.success) return null;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v));
    } else {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query.length > 0 ? query : null;
}

function toListingFields(pkg: PackageRecord): Omit<PublicPackageListing, "priceType"> & { priceType: string } {
  return {
    id: pkg.id,
    slug: pkg.slug,
    name: pkg.name,
    targetCustomerDescription: pkg.targetCustomerDescription,
    category: pkg.category,
    cameraCount: pkg.cameraCount,
    cameraTypeSummary: pkg.cameraTypeSummary,
    storageSummary: pkg.storageSummary,
    priceType: resolveEffectivePackagePriceType(pkg.priceType, pkg.priceVerificationDate),
    priceValue: pkg.priceValue,
    priceValueMax: pkg.priceValueMax,
    // Approximate count from the raw item list (excluding EXCLUDED items),
    // not the fully-resolved public item list — resolving every item's
    // product visibility for every package in a listing would mean N
    // extra lookups per package just to show a number. The detail page's
    // `items` array is the authoritative, fully-resolved list; this count
    // can be very slightly higher than `items.length` there if a package
    // references a product that has since been unpublished.
    itemCount: pkg.items.filter((i) => i.inclusionStatus !== "EXCLUDED").length,
  };
}

export interface PublicPackageReader {
  list(): Promise<PackageRecord[]>;
  findBySlug(slug: string): Promise<PackageRecord | null>;
}

export interface CatalogueDeps {
  packages: PublicPackageReader;
}

export interface PackageDetailDeps extends ProductDetailDeps {
  packages: PublicPackageReader;
  warranties: Pick<WarrantyRepository, "findById">;
}

/**
 * Fetches the public package listing. No filtering in this batch (the
 * catalogue is expected to be small — a handful of curated packages, not a
 * large browsable inventory like Products) — every PUBLISHED package is
 * returned, sorted by name for a stable, predictable order.
 */
export async function buildPublicPackageCatalogue(deps: CatalogueDeps): Promise<PublicPackageListing[]> {
  const all = await deps.packages.list();
  return all
    .filter((p) => p.status === "PUBLISHED")
    .map(toListingFields)
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function resolvePublicItems(deps: PackageDetailDeps, items: PackageItemRecord[]): Promise<PublicPackageItem[]> {
  const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder);
  const resolved = await Promise.all(
    sorted.map(async (item) => {
      const product = await buildPublicProductById(deps, item.productId);
      if (!product) return null;
      const publicItem: PublicPackageItem = {
        id: item.id,
        quantity: item.quantity,
        requirement: item.requirement,
        inclusionStatus: item.inclusionStatus,
        customerFacingDescription: item.customerFacingDescription,
        displayOrder: item.displayOrder,
        product,
      };
      return publicItem;
    })
  );
  return resolved.filter((item): item is PublicPackageItem => item !== null);
}

/**
 * Fetches a single package for /packages/[slug]. Returns null for:
 *   - no package with that slug
 *   - a package that exists but is DRAFT or ARCHIVED (not publicly visible)
 * Same "indistinguishable to the caller" reasoning as
 * buildPublicProductDetail in productCatalogue.ts.
 */
export async function buildPublicPackageDetail(deps: PackageDetailDeps, slug: string): Promise<PublicPackageDetail | null> {
  const pkg = await deps.packages.findBySlug(slug);
  if (!pkg || pkg.status !== "PUBLISHED") return null;

  const [recorder, warranty, items] = await Promise.all([
    pkg.recorderProductId ? buildPublicProductById(deps, pkg.recorderProductId) : Promise.resolve(null),
    pkg.warrantyId ? deps.warranties.findById(pkg.warrantyId) : Promise.resolve(null),
    resolvePublicItems(deps, pkg.items),
  ]);

  return {
    ...toListingFields(pkg),
    networkingSummary: pkg.networkingSummary,
    cablingAssumptionText: pkg.cablingAssumptionText,
    powerSummary: pkg.powerSummary,
    installationSummary: pkg.installationSummary,
    recorder,
    warranty: warranty
      ? {
          id: warranty.id,
          name: warranty.name,
          durationMonths: warranty.durationMonths,
          provider: warranty.provider,
          warrantyType: warranty.warrantyType,
          conditionsText: warranty.conditionsText,
          exclusionsText: warranty.exclusionsText,
        }
      : null,
    items,
    configuratorPrefillQuery: buildConfiguratorPrefillQuery(pkg.configuratorPrefill),
  };
}
