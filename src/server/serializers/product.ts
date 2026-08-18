import "server-only";
import { resolveEffectivePriceType } from "@/server/pricing/pricingStatus";
import type { PriceType } from "@/server/pricing/types";

/**
 * Public-facing serializers.
 *
 * Hard rule (Phase 2 §C, Phase 4 §3.2): supplier_cost, supplier notes,
 * source_url, and any internal-only field must NEVER reach a public API
 * response. This module enforces that with an ALLOWLIST, not a denylist —
 * a new internal field added to the Prisma schema later (e.g. a future
 * `marginPercent` column) is excluded from every public response BY
 * DEFAULT, because it simply won't be in the picked field list below, not
 * because someone remembered to add it to an exclusion list.
 *
 * Stage 2 addition: this is also the enforcement point for "the public
 * calculator must never use NEEDS_REVIEW or STALE as verified pricing"
 * (Stage 2 §10) — `toPublicProduct` calls `resolveEffectivePriceType` so a
 * non-VERIFIED product downgrades to QUOTE_ONLY here, at the boundary,
 * rather than relying on every consumer of this function to remember to
 * check pricingStatus separately.
 *
 * Input types are intentionally loose (`Record<string, unknown>`-shaped
 * subsets) rather than importing generated Prisma types, so this module has
 * zero dependency on `@prisma/client` and stays testable without a database
 * or a successful `prisma generate` — see src/server/db/client.ts for why
 * that matters in this environment.
 */

export interface InternalProductRecord {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  brandId: string;
  categoryId: string;
  productType: string;
  shortDescription: string | null;
  longDescription: string | null;
  images: unknown;
  specifications: unknown;
  useCases: string[];
  warrantyId: string | null;
  customerPriceType: PriceType;
  customerPriceValue: number | null;
  customerPriceValueMax: number | null;
  installationPriceType: PriceType;
  installationPriceValue: number | null;
  installationPriceValueMax: number | null;
  pricingStatus: "VERIFIED" | "NEEDS_REVIEW" | "STALE";
  availability: string;
  configuratorTags: string[];
  status: string;
  // Internal-only fields — present on the DB record, deliberately NOT
  // referenced below.
  supplierCost: number | null;
  sourceUrl: string | null;
  supplierId: string | null;
}

export type PublicProduct = Pick<
  InternalProductRecord,
  | "id"
  | "slug"
  | "name"
  | "sku"
  | "brandId"
  | "categoryId"
  | "productType"
  | "shortDescription"
  | "longDescription"
  | "images"
  | "specifications"
  | "useCases"
  | "warrantyId"
  | "customerPriceValue"
  | "customerPriceValueMax"
  | "installationPriceType"
  | "installationPriceValue"
  | "installationPriceValueMax"
  | "availability"
  | "configuratorTags"
> & {
  /** Already downgraded to QUOTE_ONLY if pricingStatus isn't VERIFIED — see module header. */
  customerPriceType: string;
};

export function toPublicProduct(product: InternalProductRecord): PublicProduct {
  // Explicit field-by-field pick — deliberately verbose instead of a spread
  // + delete, so a reviewer can see exactly what's exposed without having to
  // reason about what was removed. Note pricingStatus itself is NOT
  // included in the output — it's an internal verification-workflow
  // concept; the public view only ever sees its already-resolved effect
  // (customerPriceType, downgraded below if not VERIFIED).
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    brandId: product.brandId,
    categoryId: product.categoryId,
    productType: product.productType,
    shortDescription: product.shortDescription,
    longDescription: product.longDescription,
    images: product.images,
    specifications: product.specifications,
    useCases: product.useCases,
    warrantyId: product.warrantyId,
    customerPriceType: resolveEffectivePriceType(product.customerPriceType, product.pricingStatus),
    customerPriceValue: product.customerPriceValue,
    customerPriceValueMax: product.customerPriceValueMax,
    installationPriceType: product.installationPriceType,
    installationPriceValue: product.installationPriceValue,
    installationPriceValueMax: product.installationPriceValueMax,
    availability: product.availability,
    configuratorTags: product.configuratorTags,
  };
}

export interface InternalSupplierRecord {
  id: string;
  name: string;
  tier: string;
  notes: string | null;
}

export type PublicSupplier = Pick<InternalSupplierRecord, "id" | "name">;

export function toPublicSupplier(supplier: InternalSupplierRecord): PublicSupplier {
  return { id: supplier.id, name: supplier.name };
}
