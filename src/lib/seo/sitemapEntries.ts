import { SITE_URL } from "@/lib/siteUrl";

/**
 * Sitemap entry-building logic — pure, zero Prisma/container dependency
 * (same testability split as src/server/publicRoutes/productCatalogue.ts
 * vs. products.ts: this file only takes repositories/readers as plain
 * parameters, so it's unit-testable with fakes; src/app/sitemap.ts is the
 * thin, container-wired wrapper that actually calls the real public
 * catalogue readers and isn't itself unit tested, matching that same
 * existing convention).
 */
export interface SitemapEntry {
  url: string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/**
 * Static, always-indexable public pages. Deliberately excludes:
 *   - /admin/** — private, auth-gated, never indexable.
 *   - /api/** — not HTML pages at all.
 *   - Any configurator *session* URL — sessions are addressed by
 *     server-side ID via POST bodies (src/server/publicRoutes/configurator.ts),
 *     never appear as a GET route segment, so there is nothing session-
 *     specific to accidentally include here. The bare /configurator tool
 *     page itself IS included below — it's a real, public, useful page.
 */
const STATIC_ENTRIES: SitemapEntry[] = [
  { url: "/", changeFrequency: "weekly", priority: 1 },
  { url: "/about", changeFrequency: "monthly", priority: 0.6 },
  { url: "/services", changeFrequency: "monthly", priority: 0.8 },
  { url: "/products", changeFrequency: "weekly", priority: 0.8 },
  { url: "/packages", changeFrequency: "weekly", priority: 0.8 },
  { url: "/configurator", changeFrequency: "monthly", priority: 0.7 },
  { url: "/request-quote", changeFrequency: "monthly", priority: 0.6 },
  { url: "/guides", changeFrequency: "monthly", priority: 0.3 },
];

/**
 * Dependency-injected shape of the two public catalogue readers this needs
 * — matches src/server/publicRoutes/products.ts / packages.ts's real
 * exported function signatures structurally, so the real functions satisfy
 * this without adaptation, and tests can pass simple fakes instead of
 * exercising the full Prisma-backed catalogue.
 */
export interface SitemapDeps {
  getProducts: () => Promise<{ products: { slug: string }[] }>;
  getPackages: () => Promise<{ slug: string }[]>;
  getServices: () => Promise<{ slug: string }[]>;
}

/**
 * Builds the full sitemap entry list: static pages + every currently
 * PUBLISHED product/package/service slug (via the same public catalogue
 * readers the actual /products, /packages, and /services pages use — an
 * entity that isn't publicly visible on the site is never listed here
 * either).
 */
export async function buildSitemapEntries(deps: SitemapDeps): Promise<SitemapEntry[]> {
  const [{ products }, packages, services] = await Promise.all([deps.getProducts(), deps.getPackages(), deps.getServices()]);

  const productEntries: SitemapEntry[] = products.map((p) => ({
    url: `/products/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const packageEntries: SitemapEntry[] = packages.map((p) => ({
    url: `/packages/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const serviceEntries: SitemapEntry[] = services.map((s) => ({
    url: `/services/${s.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...STATIC_ENTRIES, ...serviceEntries, ...productEntries, ...packageEntries];
}

/** Prefixes every relative entry URL with SITE_URL, for the final Next.js sitemap output. */
export function toAbsoluteSitemap(entries: SitemapEntry[]): (SitemapEntry & { url: string })[] {
  return entries.map((e) => ({ ...e, url: `${SITE_URL}${e.url}` }));
}
