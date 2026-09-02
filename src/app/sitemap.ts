import type { MetadataRoute } from "next";
import { getPublicProductCatalogue } from "@/server/publicRoutes/products";
import { getPublicPackageCatalogue } from "@/server/publicRoutes/packages";
import { getPublicServiceCatalogue } from "@/server/publicRoutes/services";
import { getPublicGuideCatalogue } from "@/server/publicRoutes/guides";
import { buildSitemapEntries, toAbsoluteSitemap } from "@/lib/seo/sitemapEntries";

/**
 * Real sitemap.xml via Next.js's built-in MetadataRoute.Sitemap API — no
 * extra package needed. Served at /sitemap.xml automatically because this
 * file is named sitemap.ts under src/app/. The actual entry-building
 * logic (which routes, which dynamic slugs, honesty about what's public)
 * lives in the pure, unit-tested src/lib/seo/sitemapEntries.ts — this file
 * only wires the real, container-backed public catalogue readers to it
 * (same container-wired-wrapper pattern as
 * src/server/publicRoutes/products.ts itself; not unit tested for the same
 * reason that file isn't — see sitemapEntries.ts's header comment).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await buildSitemapEntries({
    getProducts: () => getPublicProductCatalogue(),
    getPackages: () => getPublicPackageCatalogue(),
    getServices: () => getPublicServiceCatalogue(),
    getGuides: () => getPublicGuideCatalogue(),
  });
  return toAbsoluteSitemap(entries);
}
