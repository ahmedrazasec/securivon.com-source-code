import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Primitives";
import { getPublicPackageBySlug } from "@/server/publicRoutes/packages";
import { formatPackagePrice, isQuoteOnlyPrice, formatProductPrice, firstProductImage } from "@/lib/marketing/productDisplay";
import type { PublicPackageItem } from "@/server/publicRoutes/packages";

const CATEGORY_LABELS: Record<string, string> = {
  HOME_STARTER: "Home — Starter",
  HOME_COMPLETE: "Home — Complete",
  SHOP_RETAIL: "Shop & Retail",
  OFFICE: "Office",
  RESTAURANT_CAFE: "Restaurant & Café",
  CUSTOM: "Custom",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPublicPackageBySlug(slug);
  if (!pkg) return {};
  return {
    title: pkg.name,
    description: pkg.targetCustomerDescription ?? `${pkg.name} — a ready-made security package from Securivon.`,
    alternates: { canonical: `/packages/${pkg.slug}` },
  };
}

export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await getPublicPackageBySlug(slug);
  if (!pkg) notFound();

  const quoteOnly = isQuoteOnlyPrice(pkg.priceType);
  const includedItems = pkg.items.filter((i) => i.inclusionStatus === "INCLUDED");
  const addonItems = pkg.items.filter((i) => i.inclusionStatus === "OPTIONAL_ADDON");
  const excludedItems = pkg.items.filter((i) => i.inclusionStatus === "EXCLUDED");

  const configureHref = pkg.configuratorPrefillQuery ? `/configurator?${pkg.configuratorPrefillQuery}` : "/configurator";

  return (
    <Container className="py-14 sm:py-20">
      <nav className="text-xs text-slate">
        <Link href="/packages" className="hover:text-ink">
          Packages
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{CATEGORY_LABELS[pkg.category] ?? pkg.category}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-strong">
            {CATEGORY_LABELS[pkg.category] ?? pkg.category}
          </span>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{pkg.name}</h1>
          {pkg.targetCustomerDescription && (
            <p className="mt-3 text-base leading-relaxed text-slate">{pkg.targetCustomerDescription}</p>
          )}

          <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg border border-line bg-paper-raised p-5 text-sm sm:grid-cols-2">
            {pkg.cameraCount !== null && (
              <SpecRow
                label="Cameras"
                value={`${pkg.cameraCount}${pkg.cameraTypeSummary ? ` — ${pkg.cameraTypeSummary}` : ""}`}
              />
            )}
            {pkg.storageSummary && <SpecRow label="Storage" value={pkg.storageSummary} />}
            {pkg.networkingSummary && <SpecRow label="Networking" value={pkg.networkingSummary} />}
            {pkg.cablingAssumptionText && <SpecRow label="Cabling assumption" value={pkg.cablingAssumptionText} />}
            {pkg.powerSummary && <SpecRow label="Power" value={pkg.powerSummary} />}
            {pkg.installationSummary && <SpecRow label="Installation" value={pkg.installationSummary} />}
          </dl>

          {pkg.recorder && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Recorder</h2>
              <Link
                href={`/products/${pkg.recorder.slug}`}
                className="mt-2 flex items-center gap-3 rounded-lg border border-line bg-paper-raised p-3 transition-colors hover:border-accent"
              >
                <RecorderThumbnail images={pkg.recorder.images} name={pkg.recorder.name} />
                <span>
                  <span className="block text-sm font-medium text-ink">{pkg.recorder.name}</span>
                  <span className="block text-xs text-slate">{formatProductPrice(pkg.recorder)}</span>
                </span>
              </Link>
            </div>
          )}

          {pkg.warranty && (
            <div className="mt-6 rounded-lg border border-line bg-paper-raised p-5">
              <h2 className="text-sm font-semibold text-ink">Warranty</h2>
              <p className="mt-1 text-sm text-slate">
                {pkg.warranty.name} — {pkg.warranty.durationMonths} month{pkg.warranty.durationMonths === 1 ? "" : "s"}
                {pkg.warranty.provider === "MANUFACTURER" && " (manufacturer)"}
                {pkg.warranty.provider === "SECURIVON" && " (Securivon)"}
                {pkg.warranty.provider === "DISTRIBUTOR" && " (distributor)"}
              </p>
              {pkg.warranty.conditionsText && <p className="mt-2 text-xs leading-relaxed text-slate">{pkg.warranty.conditionsText}</p>}
              {pkg.warranty.exclusionsText && (
                <p className="mt-2 text-xs leading-relaxed text-slate">
                  <span className="font-semibold">Exclusions: </span>
                  {pkg.warranty.exclusionsText}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="rounded-lg border border-line bg-paper-raised p-5">
            <p className="text-xl font-semibold text-ink">{formatPackagePrice(pkg)}</p>
            {!quoteOnly && <p className="mt-1 text-xs text-slate">Verified price — final quote may vary based on your site.</p>}
            {quoteOnly && <p className="mt-1 text-xs text-slate">Pricing for this package hasn&rsquo;t been confirmed yet — request a quote and we&rsquo;ll get back to you with real numbers.</p>}

            <div className="mt-5 flex flex-col gap-3">
              <Link
                href={configureHref}
                className="rounded-md bg-ink px-6 py-3 text-center text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
              >
                Configure This Package
              </Link>
              <Link
                href="/request-quote"
                className="rounded-md border border-line px-6 py-3 text-center text-sm font-semibold text-ink transition-colors hover:border-accent"
              >
                Request a Quote
              </Link>
            </div>
          </div>

          {includedItems.length > 0 && (
            <ItemGroup title="What's included" items={includedItems} />
          )}
          {addonItems.length > 0 && (
            <ItemGroup title="Optional add-ons" items={addonItems} />
          )}
          {excludedItems.length > 0 && (
            <ItemGroup title="Not included" items={excludedItems} muted />
          )}
        </div>
      </div>
    </Container>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}

function ItemGroup({ title, items, muted = false }: { title: string; items: PublicPackageItem[]; muted?: boolean }) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">{title}</h2>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.id} className={`rounded-lg border border-line p-3 ${muted ? "bg-paper opacity-70" : "bg-paper-raised"}`}>
            <Link href={`/products/${item.product.slug}`} className="flex items-center justify-between gap-3 hover:text-accent-strong">
              <span>
                <span className="block text-sm font-medium text-ink">
                  {item.quantity > 1 ? `${item.quantity}x ` : ""}
                  {item.product.name}
                </span>
                {item.customerFacingDescription && <span className="block text-xs text-slate">{item.customerFacingDescription}</span>}
              </span>
              {item.requirement === "OPTIONAL" && item.inclusionStatus !== "EXCLUDED" && (
                <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] text-slate">Optional</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecorderThumbnail({ images, name }: { images: unknown; name: string }) {
  const image = firstProductImage(images);
  if (!image) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-line bg-paper">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-line" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- admin-entered image source, arbitrary host
  return <img src={image.url} alt={image.alt ?? name} className="h-12 w-12 shrink-0 rounded-md object-cover" />;
}
