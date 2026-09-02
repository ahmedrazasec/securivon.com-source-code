import "server-only";
import type { GuideRepository } from "@/server/repositories/types";
import { productImages } from "@/lib/marketing/productDisplay";
import { deriveExcerpt, estimateReadingTimeMinutes } from "@/lib/marketing/guideContent";

export interface PublicGuideListing {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  images: Array<{ url: string; alt?: string }>;
  readingTimeMinutes: number;
  publishedAt: string | null;
}

export interface PublicGuideDetail extends PublicGuideListing {
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

interface GuideCatalogueDeps {
  guides: GuideRepository;
}

/**
 * Publication rule + public-field allowlist for Guides — same shape as
 * buildPublicServiceCatalogue in serviceCatalogue.ts: only PUBLISHED
 * guides are ever returned, and only the fields listed in
 * PublicGuideListing/PublicGuideDetail are exposed (no `status`, no admin
 * timestamps beyond publishedAt). `excerpt` and `readingTimeMinutes` are
 * derived from `body` here rather than stored, so there's no separate
 * excerpt field to keep in sync with the real content.
 */
export async function buildPublicGuideCatalogue(deps: GuideCatalogueDeps): Promise<PublicGuideListing[]> {
  const all = await deps.guides.list();
  return all
    .filter((g) => g.status === "PUBLISHED")
    .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt))
    .map(toPublicListing);
}

export async function buildPublicGuideDetail(deps: GuideCatalogueDeps, slug: string): Promise<PublicGuideDetail | null> {
  const guide = await deps.guides.findBySlug(slug);
  if (!guide || guide.status !== "PUBLISHED") return null;

  return {
    ...toPublicListing(guide),
    body: guide.body,
    seoTitle: guide.seoTitle,
    seoDescription: guide.seoDescription,
  };
}

function toPublicListing(guide: {
  id: string;
  slug: string;
  title: string;
  body: string;
  images: unknown;
  publishedAt: string | null;
}): PublicGuideListing {
  return {
    id: guide.id,
    slug: guide.slug,
    title: guide.title,
    excerpt: deriveExcerpt(guide.body),
    images: productImages(guide.images),
    readingTimeMinutes: estimateReadingTimeMinutes(guide.body),
    publishedAt: guide.publishedAt,
  };
}
