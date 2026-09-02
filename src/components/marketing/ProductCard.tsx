import type { PublicProductListing } from "@/server/publicRoutes/products";
import { formatProductPrice, formatAvailabilityLabel, isAvailabilityConcerning, firstProductImage } from "@/lib/marketing/productDisplay";
import { Card, Badge } from "@/components/marketing/ui";

export function ProductCard({ product }: { product: PublicProductListing }) {
  const availabilityLabel = formatAvailabilityLabel(product.availability);
  const image = firstProductImage(product.images);

  return (
    <Card href={`/products/${product.slug}`} className="flex flex-col overflow-hidden p-0">
      <div className="relative flex aspect-[4/3] items-center justify-center border-b border-line bg-paper">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- product image origin is admin-entered and not known ahead of time, so next/image remote-pattern config would need to allow arbitrary hosts anyway
          <img
            src={image.url}
            alt={image.alt ?? product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <ProductPlaceholderIcon />
        )}
        {availabilityLabel && isAvailabilityConcerning(product.availability) && (
          <Badge tone="warn" className="absolute left-3 top-3 bg-paper-raised">
            {availabilityLabel}
          </Badge>
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
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate">{product.shortDescription}</p>
        )}

        <div className="mt-4 flex flex-1 items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-sm font-semibold text-ink">{formatProductPrice(product)}</p>
            {availabilityLabel && !isAvailabilityConcerning(product.availability) && (
              <p className="mt-0.5 text-xs text-slate">{availabilityLabel}</p>
            )}
          </div>
          <span className="shrink-0 text-xs font-semibold text-accent-strong">View Details →</span>
        </div>
      </div>
    </Card>
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
