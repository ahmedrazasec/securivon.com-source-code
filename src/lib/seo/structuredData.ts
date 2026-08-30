import type { PublicProductDetail } from "@/server/publicRoutes/productCatalogue";
import type { PublicPackageDetail } from "@/server/publicRoutes/packageCatalogue";
import type { PublicServiceDetail } from "@/server/publicRoutes/serviceCatalogue";
import { firstProductImage } from "@/lib/marketing/productDisplay";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Pure JSON-LD builder functions — no "server-only", no Prisma, no
 * container. Only `import type` from the server/publicRoutes modules (type
 * information only, stripped at compile time), so these are unit-testable
 * with plain in-memory fixtures, same testability convention as
 * src/lib/marketing/productDisplay.ts.
 *
 * PRICING HONESTY: buildOffers() mirrors
 * src/lib/marketing/productDisplay.ts's formatProductPrice() switch
 * exactly — QUOTE_ONLY (or a missing numeric value for any other type)
 * means no `offers` block at all, never a fabricated or zero price. This
 * is deliberately NOT re-derived from pricingStatus/priceVerificationDate
 * here — customerPriceType/priceType arriving at this function have
 * already been downgraded to QUOTE_ONLY by
 * src/server/serializers/product.ts / packageCatalogue.ts's
 * resolveEffectivePackagePriceType before this code ever sees them, so
 * re-checking here would be redundant, not additional safety.
 */

const AVAILABILITY_SCHEMA: Record<string, string> = {
  IN_STOCK: "https://schema.org/InStock",
  LOW_STOCK: "https://schema.org/LimitedAvailability",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
  ORDER_REQUIRED: "https://schema.org/BackOrder",
  DISCONTINUED: "https://schema.org/Discontinued",
  // UNKNOWN intentionally has no entry — never asserted to a crawler, same
  // rule as formatAvailabilityLabel() returning null for UNKNOWN.
};

interface OfferInput {
  priceType: string;
  priceValue: number | null;
  priceValueMax: number | null;
  /** Product has a real availability enum; Package doesn't — pass null for Package. */
  availability: string | null;
}

function buildOffers(input: OfferInput): Record<string, unknown> | undefined {
  const availability = input.availability ? AVAILABILITY_SCHEMA[input.availability] : undefined;
  switch (input.priceType) {
    case "FIXED":
    case "STARTING_FROM":
    case "ESTIMATED":
      if (input.priceValue === null) return undefined;
      return { "@type": "Offer", priceCurrency: "PKR", price: input.priceValue, ...(availability ? { availability } : {}) };
    case "RANGE":
      if (input.priceValue === null || input.priceValueMax === null) return undefined;
      return {
        "@type": "AggregateOffer",
        priceCurrency: "PKR",
        lowPrice: input.priceValue,
        highPrice: input.priceValueMax,
        ...(availability ? { availability } : {}),
      };
    case "QUOTE_ONLY":
    default:
      // No real, verified numeric price exists — asserting one (even the
      // low end of a stale range) would be exactly the kind of fabricated
      // pricing fact this project's rules prohibit.
      return undefined;
  }
}

/** Resolves a possibly-relative image URL against SITE_URL; returns undefined if malformed rather than emitting a broken `image` field. */
function absoluteImageUrl(images: unknown): string | undefined {
  const image = firstProductImage(images);
  if (!image) return undefined;
  try {
    return new URL(image.url, SITE_URL).toString();
  } catch {
    return undefined;
  }
}

export function buildProductJsonLd(product: PublicProductDetail): Record<string, unknown> {
  const offers = buildOffers({
    priceType: product.customerPriceType,
    priceValue: product.customerPriceValue,
    priceValueMax: product.customerPriceValueMax,
    availability: product.availability,
  });
  const image = absoluteImageUrl(product.images);
  const description = product.shortDescription ?? product.longDescription ?? undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: `${SITE_URL}/products/${product.slug}`,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(description ? { description } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(image ? { image } : {}),
    ...(offers ? { offers } : {}),
  };
}

/**
 * Package is a purchasable bundle of products, not a single item — schema.org
 * has no dedicated "bundle" type with meaningful search-engine support, so
 * this represents it as a Product (the standard approach for kits/bundles),
 * reusing the same allowlisted PublicPackageDetail fields the page itself
 * renders. No `image`/`sku`/`brand` — Package has none of those fields.
 */
export function buildPackageJsonLd(pkg: PublicPackageDetail): Record<string, unknown> {
  const offers = buildOffers({
    priceType: pkg.priceType,
    priceValue: pkg.priceValue,
    priceValueMax: pkg.priceValueMax,
    availability: null,
  });

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.name,
    url: `${SITE_URL}/packages/${pkg.slug}`,
    ...(pkg.targetCustomerDescription ? { description: pkg.targetCustomerDescription } : {}),
    ...(offers ? { offers } : {}),
  };
}

/** Service pages have no pricing/availability data at all (Service content has no price field) — deliberately no `offers` block. */
export function buildServiceJsonLd(service: PublicServiceDetail): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.shortDescription ?? service.seoDescription ?? undefined,
    url: `${SITE_URL}/services/${service.slug}`,
    provider: { "@type": "Organization", name: "Securivon", url: SITE_URL },
    areaServed: "PK",
  };
}
