import "server-only";
import { container } from "@/server/container";
import { buildPublicGuideCatalogue, buildPublicGuideDetail, type PublicGuideListing, type PublicGuideDetail } from "@/server/publicRoutes/guideCatalogue";

/**
 * Real, container-wired entry points for the public /guides pages and
 * src/app/sitemap.ts. Thin wrapper around the pure, unit-tested functions
 * in guideCatalogue.ts — not itself unit tested, matching the existing
 * convention (see services.ts/products.ts/packages.ts).
 */

export async function getPublicGuideCatalogue(): Promise<PublicGuideListing[]> {
  return buildPublicGuideCatalogue({ guides: container.guides });
}

export async function getPublicGuideBySlug(slug: string): Promise<PublicGuideDetail | null> {
  return buildPublicGuideDetail({ guides: container.guides }, slug);
}
