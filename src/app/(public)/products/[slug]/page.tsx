import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Primitives";
import { getPublicProductBySlug } from "@/server/publicRoutes/products";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildProductJsonLd } from "@/lib/seo/structuredData";
import {
  formatProductPrice,
  isQuoteOnlyPrice,
  formatAvailabilityLabel,
  isAvailabilityConcerning,
  extractDisplayableSpecs,
  firstProductImage,
} from "@/lib/marketing/productDisplay";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription ?? `${product.name} — available from Securivon.`,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) notFound();

  const specs = extractDisplayableSpecs(product.specifications);
  const availabilityLabel = formatAvailabilityLabel(product.availability);
  const quoteOnly = isQuoteOnlyPrice(product.customerPriceType);
  const image = firstProductImage(product.images);

  return (
    <Container className="py-14 sm:py-20">
      <JsonLd data={buildProductJsonLd(product)} />
      <nav className="text-xs text-slate">
        <Link href="/products" className="hover:text-ink">
          Products
        </Link>
        {product.category && (
          <>
            <span aria-hidden="true"> / </span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-line bg-paper-raised">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-entered image source, arbitrary host
            <img src={image.url} alt={image.alt ?? product.name} className="h-full w-full object-cover" />
          ) : (
            <ProductPlaceholderIcon />
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate">
            {product.brand && <span>{product.brand.name}</span>}
            {product.brand && product.category && <span aria-hidden="true">·</span>}
            {product.category && <span>{product.category.name}</span>}
          </div>

          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="mt-3 text-base leading-relaxed text-slate">{product.shortDescription}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="text-xl font-semibold text-ink">{formatProductPrice(product)}</p>
            {availabilityLabel && (
              <span className={`text-sm ${isAvailabilityConcerning(product.availability) ? "text-warn" : "text-slate"}`}>
                {availabilityLabel}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {quoteOnly ? (
              <Link
                href="/request-quote"
                className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
              >
                Request a Quote
              </Link>
            ) : (
              <Link
                href="/configurator"
                className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
              >
                Configure a System
              </Link>
            )}
            <a
              href="https://wa.me/923110597513"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              Ask on WhatsApp →
            </a>
          </div>

          {product.warranty && (
            <div className="mt-8 rounded-lg border border-line bg-paper-raised p-5">
              <h2 className="text-sm font-semibold text-ink">Warranty</h2>
              <p className="mt-1 text-sm text-slate">
                {product.warranty.name} — {product.warranty.durationMonths} month{product.warranty.durationMonths === 1 ? "" : "s"}
                {product.warranty.provider === "MANUFACTURER" && " (manufacturer)"}
                {product.warranty.provider === "SECURIVON" && " (Securivon)"}
                {product.warranty.provider === "DISTRIBUTOR" && " (distributor)"}
              </p>
              {product.warranty.conditionsText && (
                <p className="mt-2 text-xs leading-relaxed text-slate">{product.warranty.conditionsText}</p>
              )}
              {product.warranty.exclusionsText && (
                <p className="mt-2 text-xs leading-relaxed text-slate">
                  <span className="font-semibold">Exclusions: </span>
                  {product.warranty.exclusionsText}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {(product.longDescription || product.useCases.length > 0 || specs.length > 0) && (
        <div className="mt-14 grid grid-cols-1 gap-10 border-t border-line pt-10 lg:grid-cols-2">
          {(product.longDescription || product.useCases.length > 0) && (
            <div className="space-y-8">
              {product.longDescription && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">About this product</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{product.longDescription}</p>
                </section>
              )}
              {product.useCases.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Suitable for</h2>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {product.useCases.map((useCase) => (
                      <li key={useCase} className="rounded-full border border-line bg-paper-raised px-3 py-1 text-xs text-slate">
                        {useCase}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {specs.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Specifications</h2>
              <dl className="mt-3 divide-y divide-line rounded-lg border border-line bg-paper-raised">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-slate">{spec.label}</dt>
                    <dd className="text-right font-medium text-ink">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      )}
    </Container>
  );
}

function ProductPlaceholderIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-14 w-14 text-line" aria-hidden="true">
      <rect x="6" y="14" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="26" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M17 14L20 9H28L31 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
