import "server-only";
import type { ServiceRecord } from "@/server/repositories/types";

/**
 * Public Service Catalogue data access — replaces the formerly-hardcoded
 * src/lib/marketing/services.ts as the source for /services and
 * /services/[slug].
 *
 * Same two safety rules as productCatalogue.ts/packageCatalogue.ts, enforced
 * here rather than left to page components:
 *
 *   1. PUBLICATION: only `status === "PUBLISHED"` services are ever
 *      returned. DRAFT and ARCHIVED are treated exactly like "not found"
 *      from a public caller's perspective.
 *
 *   2. FIELD ALLOWLISTING: `toPublicService` picks an explicit field list —
 *      it happens that Service has no internal-only columns today (no
 *      supplierCost-style field to leak), but the allowlist still exists so
 *      a future internal-only column added to the Service model (e.g. an
 *      internal authoring note) doesn't silently reach a public response
 *      just because a new field was added to the model.
 *
 * TESTABILITY: no import of src/server/container.ts — every function here
 * takes its repository as a plain parameter, same pattern as
 * productCatalogue.ts/packageCatalogue.ts, so tests exercise the real
 * publication/allowlist rules against test/fakes/repositories.ts's
 * InMemoryServiceRepository. src/server/publicRoutes/services.ts is the
 * thin, container-wired wrapper the Server Component pages actually call.
 */

export interface PublicServiceListing {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  quoteOnly: boolean;
}

export interface PublicServiceDetail extends PublicServiceListing {
  problem: string | null;
  solution: string | null;
  /** Split from Service.suitableCustomersText — one list item per non-blank line. */
  suitableFor: string[];
  /** Split from Service.featuresText — one list item per non-blank line. */
  components: string[];
  considerations: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface PublicServiceReader {
  list(): Promise<ServiceRecord[]>;
  findBySlug(slug: string): Promise<ServiceRecord | null>;
}

/** Splits admin-authored plain-text into a list, one item per non-blank line — the same convention a Textarea-backed "one per line" field implies elsewhere in the admin UI. */
function toLines(text: string | null): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function toListingFields(s: ServiceRecord): PublicServiceListing {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    shortDescription: s.shortDescription,
    quoteOnly: s.quoteOnly,
  };
}

function toPublicServiceDetail(s: ServiceRecord): PublicServiceDetail {
  return {
    ...toListingFields(s),
    problem: s.problemText,
    solution: s.solutionText,
    suitableFor: toLines(s.suitableCustomersText),
    components: toLines(s.featuresText),
    considerations: s.considerationsText,
    seoTitle: s.seoTitle,
    seoDescription: s.seoDescription,
  };
}

export async function buildPublicServiceCatalogue(deps: { services: Pick<PublicServiceReader, "list"> }): Promise<PublicServiceListing[]> {
  const services = await deps.services.list();
  return services.filter((s) => s.status === "PUBLISHED").map(toListingFields);
}

export async function buildPublicServiceDetail(
  deps: { services: Pick<PublicServiceReader, "findBySlug"> },
  slug: string
): Promise<PublicServiceDetail | null> {
  const service = await deps.services.findBySlug(slug);
  if (!service || service.status !== "PUBLISHED") return null;
  return toPublicServiceDetail(service);
}
