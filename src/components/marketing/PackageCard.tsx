import type { PublicPackageListing } from "@/server/publicRoutes/packages";
import { formatPackagePrice, isQuoteOnlyPrice } from "@/lib/marketing/productDisplay";
import { Card, Badge } from "@/components/marketing/ui";

const CATEGORY_LABELS: Record<string, string> = {
  HOME_STARTER: "Home — Starter",
  HOME_COMPLETE: "Home — Complete",
  SHOP_RETAIL: "Shop & Retail",
  OFFICE: "Office",
  RESTAURANT_CAFE: "Restaurant & Café",
  CUSTOM: "Custom",
};

export { CATEGORY_LABELS };

export function PackageCard({ pkg }: { pkg: PublicPackageListing }) {
  const image = pkg.images[0];
  const quoteOnly = isQuoteOnlyPrice(pkg.priceType);

  return (
    <Card href={`/packages/${pkg.slug}`} className="flex flex-col overflow-hidden p-0">
      <div className="flex aspect-[4/3] items-center justify-center border-b border-line bg-paper">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-entered image source, arbitrary host
          <img
            src={image.url}
            alt={image.alt ?? pkg.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <PackagePlaceholderIcon />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-accent-strong">
          {CATEGORY_LABELS[pkg.category] ?? pkg.category}
        </span>
        <h3 className="mt-1 text-base font-semibold text-ink group-hover:text-accent-strong">{pkg.name}</h3>
        {pkg.targetCustomerDescription && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate">{pkg.targetCustomerDescription}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {pkg.cameraCount !== null && (
            <Badge>
              {pkg.cameraCount} camera{pkg.cameraCount === 1 ? "" : "s"}
            </Badge>
          )}
          {pkg.storageSummary && <Badge>{pkg.storageSummary}</Badge>}
          <Badge>
            {pkg.itemCount} item{pkg.itemCount === 1 ? "" : "s"} included
          </Badge>
        </div>

        <div className="mt-4 flex flex-1 items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-sm font-semibold text-ink">{formatPackagePrice(pkg)}</p>
            {!quoteOnly && <p className="mt-0.5 text-[11px] text-slate">Verified — may vary by site</p>}
          </div>
          <span className="shrink-0 text-xs font-semibold text-accent-strong">View Details →</span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Layered-panels motif (a stack of coverage/equipment "layers" forming one
 * system) — grounded in the actual idea of a package being several
 * components bundled together, rather than a generic box/gift icon.
 */
function PackagePlaceholderIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10 text-line" aria-hidden="true">
      <rect x="8" y="10" width="32" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="8" y="24" width="32" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="15" r="1.6" fill="currentColor" />
      <circle cx="14" cy="29" r="1.6" fill="currentColor" />
    </svg>
  );
}
