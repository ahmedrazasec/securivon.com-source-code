import { formatPKR } from "@/lib/format";

/**
 * Product price/availability display helpers.
 *
 * No "server-only" import — used by Server Components (the catalogue pages)
 * but written so it could be reused client-side too, matching src/lib/format.ts.
 *
 * `customerPriceType` here is always the value returned by
 * toPublicProduct/resolveEffectivePriceType (src/server/serializers/product.ts,
 * src/server/pricing/pricingStatus.ts) — i.e. already downgraded to
 * QUOTE_ONLY when the underlying pricingStatus isn't VERIFIED. This module
 * has no pricing-trust logic of its own; it only decides how to word an
 * already-decided price type.
 */

export interface ProductPriceInput {
  customerPriceType: string;
  customerPriceValue: number | null;
  customerPriceValueMax: number | null;
}

export function formatProductPrice({ customerPriceType, customerPriceValue, customerPriceValueMax }: ProductPriceInput): string {
  switch (customerPriceType) {
    case "FIXED":
      return customerPriceValue !== null ? formatPKR(customerPriceValue) : "Request Quote";
    case "STARTING_FROM":
      return customerPriceValue !== null ? `From ${formatPKR(customerPriceValue)}` : "Request Quote";
    case "RANGE":
      return customerPriceValue !== null && customerPriceValueMax !== null
        ? `${formatPKR(customerPriceValue)} – ${formatPKR(customerPriceValueMax)}`
        : "Request Quote";
    case "ESTIMATED":
      return customerPriceValue !== null ? `Est. ${formatPKR(customerPriceValue)}` : "Request Quote";
    case "QUOTE_ONLY":
    default:
      return "Request Quote";
  }
}

/** True when the price should be presented with a "Request Quote" CTA rather than a computed number. */
export function isQuoteOnlyPrice(customerPriceType: string): boolean {
  return customerPriceType === "QUOTE_ONLY";
}

/**
 * Package price fields are named priceType/priceValue/priceValueMax (not
 * the customerPriceType/... naming Product uses) — same formatting rules
 * apply, so this just adapts the field names and reuses formatProductPrice
 * rather than duplicating the switch statement.
 */
export interface PackagePriceInput {
  priceType: string;
  priceValue: number | null;
  priceValueMax: number | null;
}

export function formatPackagePrice({ priceType, priceValue, priceValueMax }: PackagePriceInput): string {
  return formatProductPrice({ customerPriceType: priceType, customerPriceValue: priceValue, customerPriceValueMax: priceValueMax });
}

const AVAILABILITY_LABELS: Record<string, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Limited Stock",
  OUT_OF_STOCK: "Out of Stock",
  ORDER_REQUIRED: "Order Required",
  DISCONTINUED: "Discontinued",
};

/**
 * Returns a display label, or null when availability shouldn't be shown at
 * all — UNKNOWN is deliberately not surfaced to customers as a badge (it's
 * an internal "not yet set" state, not customer-facing information).
 */
export function formatAvailabilityLabel(availability: string): string | null {
  return AVAILABILITY_LABELS[availability] ?? null;
}

export function isAvailabilityConcerning(availability: string): boolean {
  return availability === "OUT_OF_STOCK" || availability === "DISCONTINUED";
}

/** Prettifies an arbitrary specification object key: "bitrateKbps" -> "Bitrate Kbps". */
export function prettifySpecKey(key: string): string {
  const withSpaces = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return withSpaces.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Product.images is an admin-authored `[{ url, alt }]` JSON blob (schema
 * comment: "production images only; never AI-generated/invented imagery").
 * Shared by the catalogue card and detail page so both interpret the same
 * loosely-typed JSON the same defensive way.
 */
export function firstProductImage(images: unknown): { url: string; alt?: string } | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (first && typeof first === "object" && "url" in first && typeof (first as { url: unknown }).url === "string") {
    const alt = "alt" in first && typeof (first as { alt: unknown }).alt === "string" ? (first as { alt: string }).alt : undefined;
    return { url: (first as { url: string }).url, alt };
  }
  return null;
}

/**
 * Product.specifications is an admin-authored, category-dependent JSON blob
 * (schema comment: "validated at the application layer against
 * Category.specificationTemplate"). No fixed shape is guaranteed, so this
 * only ever displays whatever plain key/value pairs are actually present —
 * never invents or infers a specification that wasn't entered.
 */
export function extractDisplayableSpecs(specifications: unknown): Array<{ label: string; value: string }> {
  if (!specifications || typeof specifications !== "object" || Array.isArray(specifications)) return [];
  const entries = Object.entries(specifications as Record<string, unknown>);
  const displayable: Array<{ label: string; value: string }> = [];
  for (const [key, value] of entries) {
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "object") continue; // skip nested structures rather than rendering "[object Object]"
    displayable.push({ label: prettifySpecKey(key), value: String(value) });
  }
  return displayable;
}
