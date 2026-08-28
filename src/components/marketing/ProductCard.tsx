import Link from "next/link";
import type { PublicProductListing } from "@/server/publicRoutes/products";
import { formatProductPrice, formatAvailabilityLabel, isAvailabilityConcerning, firstProductImage } from "@/lib/marketing/productDisplay";

export function ProductCard({ product }: { product: PublicProductListing }) {
  const availabilityLabel = formatAvailabilityLabel(product.availability);
  const image = firstProductImage(product.images);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-paper-raised transition-colors hover:border-accent"
    >
      <div className="flex aspect-[4/3] items-center justify-center border-b border-line bg-paper">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- product image origin is admin-entered and not known ahead of time, so next/image remote-pattern config would need to allow arbitrary hosts anyway
          <img src={image.url} alt={image.alt ?? product.name} className="h-full w-full object-cover" />
        ) : (
          <ProductPlaceholderIcon />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate">
          {product.brand && <span>{product.brand.name}</span>}
          {product.brand && product.category && <span aria-hidden="true">·</span>}
          {product.category && <span>{product.category.name}</span>}
        </div>

        <h3 className="mt-1 text-sm font-semibold text-ink group-hover:text-accent-strong">{product.name}</h3>

        {product.shortDescription && (
          <p className="mt-2 text-sm leading-relaxed text-slate">{product.shortDescription}</p>
        )}

        <div className="mt-4 flex flex-1 items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">{formatProductPrice(product)}</p>
            {availabilityLabel && (
              <p className={`mt-0.5 text-xs ${isAvailabilityConcerning(product.availability) ? "text-warn" : "text-slate"}`}>
                {availabilityLabel}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs font-semibold text-accent-strong">View Details →</span>
        </div>
      </div>
    </Link>
  );
}

function ProductPlaceholderIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10 text-line" aria-hidden="true">
      <rect x="6" y="14" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="26" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M17 14L20 9H28L31 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
