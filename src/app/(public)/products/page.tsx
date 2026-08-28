import type { Metadata } from "next";
import Link from "next/link";
import { Container, SectionHeading } from "@/components/marketing/Primitives";
import { ProductCard } from "@/components/marketing/ProductCard";
import { getPublicProductCatalogue } from "@/server/publicRoutes/products";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse CCTV cameras, recorders, and security equipment from Securivon.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string }>;
}) {
  const { category, brand } = await searchParams;
  const catalogue = await getPublicProductCatalogue({ categorySlug: category, brandSlug: brand });
  const hasActiveFilter = Boolean(category || brand);

  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading
        eyebrow="Products"
        title="Security equipment we install and support"
        description="Cameras, recorders, and related equipment we've sourced, verified, and stand behind. Every price shown here is either a real, verified price or an honest request for a quote — never a guess."
      />

      {catalogue.catalogueIsEmpty ? (
        <EmptyCatalogueState />
      ) : (
        <>
          {(catalogue.availableCategories.length > 1 || catalogue.availableBrands.length > 1) && (
            <FilterPills
              categories={catalogue.availableCategories}
              brands={catalogue.availableBrands}
              activeCategory={category}
              activeBrand={brand}
            />
          )}

          {catalogue.products.length === 0 ? (
            <NoFilterMatchState />
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {catalogue.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {hasActiveFilter && catalogue.products.length === 0 && (
            <div className="mt-6 text-center">
              <Link href="/products" className="text-sm font-semibold text-accent-strong underline underline-offset-4">
                Clear filters
              </Link>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

function FilterPills({
  categories,
  brands,
  activeCategory,
  activeBrand,
}: {
  categories: { slug: string; name: string }[];
  brands: { slug: string; name: string }[];
  activeCategory?: string;
  activeBrand?: string;
}) {
  return (
    <div className="mt-8 space-y-3">
      {categories.length > 1 && (
        <PillRow
          label="Category"
          options={categories}
          activeSlug={activeCategory}
          buildHref={(slug) =>
            slug ? `/products?category=${slug}${activeBrand ? `&brand=${activeBrand}` : ""}` : buildHrefWithout("category", activeBrand)
          }
        />
      )}
      {brands.length > 1 && (
        <PillRow
          label="Brand"
          options={brands}
          activeSlug={activeBrand}
          buildHref={(slug) =>
            slug ? `/products?brand=${slug}${activeCategory ? `&category=${activeCategory}` : ""}` : buildHrefWithout("brand", activeCategory)
          }
        />
      )}
    </div>
  );
}

function buildHrefWithout(cleared: "category" | "brand", remaining?: string) {
  if (!remaining) return "/products";
  return cleared === "category" ? `/products?brand=${remaining}` : `/products?category=${remaining}`;
}

function PillRow({
  label,
  options,
  activeSlug,
  buildHref,
}: {
  label: string;
  options: { slug: string; name: string }[];
  activeSlug?: string;
  buildHref: (slug: string | null) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</span>
      <Link
        href={buildHref(null)}
        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
          !activeSlug ? "border-ink bg-ink text-paper" : "border-line bg-paper-raised text-slate hover:border-accent"
        }`}
      >
        All
      </Link>
      {options.map((option) => (
        <Link
          key={option.slug}
          href={buildHref(option.slug)}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            activeSlug === option.slug ? "border-ink bg-ink text-paper" : "border-line bg-paper-raised text-slate hover:border-accent"
          }`}
        >
          {option.name}
        </Link>
      ))}
    </div>
  );
}

function EmptyCatalogueState() {
  return (
    <div className="mt-10 rounded-lg border border-line bg-paper-raised p-8 text-center">
      <p className="text-sm leading-relaxed text-slate">
        We&rsquo;re still publishing our product catalogue. In the meantime, message us on WhatsApp or request a
        quote and we&rsquo;ll recommend the right equipment for your property.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/request-quote"
          className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
        >
          Request a Quote
        </Link>
        <a
          href="https://wa.me/923110597513"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          Chat on WhatsApp →
        </a>
      </div>
    </div>
  );
}

function NoFilterMatchState() {
  return (
    <div className="mt-10 rounded-lg border border-line bg-paper-raised p-8 text-center">
      <p className="text-sm leading-relaxed text-slate">No products match this filter yet.</p>
    </div>
  );
}
