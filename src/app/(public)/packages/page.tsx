import type { Metadata } from "next";
import Link from "next/link";
import { Container, SectionHeading } from "@/components/marketing/Primitives";
import { getPublicPackageCatalogue } from "@/server/publicRoutes/packages";
import { formatPackagePrice, isQuoteOnlyPrice } from "@/lib/marketing/productDisplay";

export const metadata: Metadata = {
  title: "Packages",
  description: "Ready-made CCTV and security packages from Securivon.",
  alternates: { canonical: "/packages" },
};

const CATEGORY_LABELS: Record<string, string> = {
  HOME_STARTER: "Home — Starter",
  HOME_COMPLETE: "Home — Complete",
  SHOP_RETAIL: "Shop & Retail",
  OFFICE: "Office",
  RESTAURANT_CAFE: "Restaurant & Café",
  CUSTOM: "Custom",
};

export default async function PackagesPage() {
  const packages = await getPublicPackageCatalogue();

  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading
        eyebrow="Packages"
        title="Ready-made security packages"
        description="A starting point for common setups — what's included, camera count, and storage at a glance. Every package can be adjusted to your property in the Configurator or by requesting a quote."
      />

      {packages.length === 0 ? (
        <EmptyPackagesState />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/packages/${pkg.slug}`}
              className="group flex flex-col rounded-lg border border-line bg-paper-raised p-5 transition-colors hover:border-accent"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-accent-strong">
                {CATEGORY_LABELS[pkg.category] ?? pkg.category}
              </span>
              <h3 className="mt-1 text-base font-semibold text-ink group-hover:text-accent-strong">{pkg.name}</h3>
              {pkg.targetCustomerDescription && (
                <p className="mt-2 text-sm leading-relaxed text-slate">{pkg.targetCustomerDescription}</p>
              )}

              <ul className="mt-4 space-y-1 text-xs text-slate">
                {pkg.cameraCount !== null && (
                  <li>
                    {pkg.cameraCount} camera{pkg.cameraCount === 1 ? "" : "s"}
                    {pkg.cameraTypeSummary ? ` — ${pkg.cameraTypeSummary}` : ""}
                  </li>
                )}
                {pkg.storageSummary && <li>{pkg.storageSummary}</li>}
                <li>
                  {pkg.itemCount} item{pkg.itemCount === 1 ? "" : "s"} included
                </li>
              </ul>

              <div className="mt-4 flex flex-1 items-end justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{formatPackagePrice(pkg)}</p>
                <span className="shrink-0 text-xs font-semibold text-accent-strong">View Details →</span>
              </div>
              {!isQuoteOnlyPrice(pkg.priceType) && (
                <p className="mt-1 text-[11px] text-slate">Verified price — final quote may vary by site.</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}

function EmptyPackagesState() {
  return (
    <div className="mt-10 rounded-lg border border-line bg-paper-raised p-8 text-center">
      <p className="text-sm leading-relaxed text-slate">
        We&rsquo;re putting together ready-made packages for common setups. Until then, request a quote or use the
        Configurator and we&rsquo;ll put one together for your property directly.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/request-quote"
          className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
        >
          Request a Quote
        </Link>
        <Link
          href="/configurator"
          className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          Use the Configurator →
        </Link>
      </div>
    </div>
  );
}
