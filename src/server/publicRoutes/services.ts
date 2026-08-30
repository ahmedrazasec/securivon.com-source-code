import "server-only";
import { container } from "@/server/container";
import { buildPublicServiceCatalogue, buildPublicServiceDetail, type PublicServiceListing, type PublicServiceDetail } from "@/server/publicRoutes/serviceCatalogue";

/**
 * Real, container-wired entry points for the public /services pages and
 * src/app/sitemap.ts. Thin wrapper around the pure, unit-tested functions
 * in serviceCatalogue.ts — not itself unit tested, matching the existing
 * convention (see products.ts/packages.ts).
 */

export async function getPublicServiceCatalogue(): Promise<PublicServiceListing[]> {
  return buildPublicServiceCatalogue({ services: container.services });
}

export async function getPublicServiceBySlug(slug: string): Promise<PublicServiceDetail | null> {
  return buildPublicServiceDetail({ services: container.services }, slug);
}
