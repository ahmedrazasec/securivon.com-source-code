import "server-only";
import { container } from "@/server/container";
import {
  buildPublicPackageCatalogue,
  buildPublicPackageDetail,
  type PublicPackageListing,
  type PublicPackageDetail,
} from "@/server/publicRoutes/packageCatalogue";

/**
 * Container-wired Public Package Catalogue entry points.
 *
 * The actual publication/allowlist/pricing-honesty logic lives in
 * src/server/publicRoutes/packageCatalogue.ts (container-free, unit
 * tested — see packageCatalogue.test.ts). This file only wires that logic
 * to the real Prisma-backed repositories via src/server/container.ts —
 * same split as src/server/publicRoutes/products.ts, for the same reason
 * (this file is not itself unit tested; every file that imports
 * `container` isn't, in this project).
 *
 * `/packages` and `/packages/[slug]` (Server Components) call these two
 * functions directly.
 */

export type { PublicPackageListing, PublicPackageDetail, PublicPackageItem } from "@/server/publicRoutes/packageCatalogue";

export async function getPublicPackageCatalogue(): Promise<PublicPackageListing[]> {
  return buildPublicPackageCatalogue({ packages: container.packages });
}

export async function getPublicPackageBySlug(slug: string): Promise<PublicPackageDetail | null> {
  return buildPublicPackageDetail(
    {
      packages: container.packages,
      products: container.products,
      categories: container.categories,
      brands: container.brands,
      warranties: container.warranties,
    },
    slug
  );
}
