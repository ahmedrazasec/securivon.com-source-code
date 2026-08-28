import "server-only";
import { container } from "@/server/container";
import {
  buildPublicCatalogue,
  buildPublicProductDetail,
  type PublicProductCatalogueFilter,
  type PublicProductCatalogue,
  type PublicProductDetail,
} from "@/server/publicRoutes/productCatalogue";

/**
 * Container-wired Public Product Catalogue entry points.
 *
 * The actual publication/allowlist logic lives in
 * src/server/publicRoutes/productCatalogue.ts (container-free, unit
 * tested — see productCatalogue.test.ts). This file only wires that logic
 * to the real Prisma-backed repositories via src/server/container.ts, which
 * is why it isn't itself unit tested — same as every other file that
 * imports `container` (src/server/adminRoutes/*.ts,
 * src/server/publicRoutes/leads.ts).
 *
 * `/products` and `/products/[slug]` (Server Components) call these two
 * functions directly.
 */

export type { PublicProductCatalogueFilter, PublicProductCatalogue, PublicProductDetail } from "@/server/publicRoutes/productCatalogue";
export type { PublicProductListing, PublicBrandRef, PublicCategoryRef, PublicWarrantyRef } from "@/server/publicRoutes/productCatalogue";

export async function getPublicProductCatalogue(filter: PublicProductCatalogueFilter = {}): Promise<PublicProductCatalogue> {
  return buildPublicCatalogue({ products: container.products, categories: container.categories, brands: container.brands }, filter);
}

export async function getPublicProductBySlug(slug: string): Promise<PublicProductDetail | null> {
  return buildPublicProductDetail(
    { products: container.products, categories: container.categories, brands: container.brands, warranties: container.warranties },
    slug
  );
}
