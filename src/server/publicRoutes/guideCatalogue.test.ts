import { describe, it, expect, beforeEach } from "vitest";
import { buildPublicGuideCatalogue, buildPublicGuideDetail } from "@/server/publicRoutes/guideCatalogue";
import { InMemoryGuideRepository } from "@test-fakes/repositories";
import type { GuideCreateInput } from "@/server/repositories/types";

function baseGuideInput(overrides: Partial<GuideCreateInput> = {}): GuideCreateInput {
  return {
    slug: "how-many-cctv-cameras-do-i-need",
    title: "How many CCTV cameras do I need?",
    body:
      "The right camera count depends on your property's layout, entry points, and the areas you actually want covered — not a fixed number.\n\n" +
      "## What to consider\n\n" +
      "- Every entry point (doors, gates, driveways)\n- Blind spots between existing cameras\n- Areas with valuables or higher foot traffic",
    images: null,
    seoTitle: null,
    seoDescription: null,
    status: "PUBLISHED",
    publishedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildPublicGuideCatalogue", () => {
  let guides: InMemoryGuideRepository;

  beforeEach(() => {
    guides = new InMemoryGuideRepository();
  });

  it("includes a PUBLISHED guide", async () => {
    await guides.create(baseGuideInput());
    const catalogue = await buildPublicGuideCatalogue({ guides });
    expect(catalogue).toHaveLength(1);
    expect(catalogue[0].slug).toBe("how-many-cctv-cameras-do-i-need");
  });

  it("excludes a DRAFT guide", async () => {
    await guides.create(baseGuideInput({ slug: "draft-guide", status: "DRAFT" }));
    const catalogue = await buildPublicGuideCatalogue({ guides });
    expect(catalogue).toHaveLength(0);
  });

  it("excludes an ARCHIVED guide", async () => {
    await guides.create(baseGuideInput({ slug: "archived-guide", status: "ARCHIVED" }));
    const catalogue = await buildPublicGuideCatalogue({ guides });
    expect(catalogue).toHaveLength(0);
  });

  it("returns only allowlisted listing fields, never status/internal timestamps", async () => {
    await guides.create(baseGuideInput());
    const catalogue = await buildPublicGuideCatalogue({ guides });
    const listing = catalogue[0] as unknown as Record<string, unknown>;
    expect(listing.status).toBeUndefined();
    expect(listing.createdAt).toBeUndefined();
    expect(listing.updatedAt).toBeUndefined();
    expect(listing.body).toBeUndefined(); // full body is detail-only, not on the listing
  });

  it("derives an excerpt and reading time rather than requiring stored fields", async () => {
    await guides.create(baseGuideInput());
    const catalogue = await buildPublicGuideCatalogue({ guides });
    expect(catalogue[0].excerpt.length).toBeGreaterThan(0);
    expect(catalogue[0].readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });
});

describe("buildPublicGuideDetail", () => {
  let guides: InMemoryGuideRepository;

  beforeEach(() => {
    guides = new InMemoryGuideRepository();
  });

  it("returns full detail for a PUBLISHED guide, including body", async () => {
    await guides.create(baseGuideInput());
    const detail = await buildPublicGuideDetail({ guides }, "how-many-cctv-cameras-do-i-need");
    expect(detail).not.toBeNull();
    expect(detail?.title).toBe("How many CCTV cameras do I need?");
    expect(detail?.body).toContain("What to consider");
  });

  it("returns null for a DRAFT guide (not yet publicly visible)", async () => {
    await guides.create(baseGuideInput({ slug: "draft-guide", status: "DRAFT" }));
    const detail = await buildPublicGuideDetail({ guides }, "draft-guide");
    expect(detail).toBeNull();
  });

  it("returns null for an ARCHIVED guide", async () => {
    await guides.create(baseGuideInput({ slug: "archived-guide", status: "ARCHIVED" }));
    const detail = await buildPublicGuideDetail({ guides }, "archived-guide");
    expect(detail).toBeNull();
  });

  it("returns null for a nonexistent slug — same not-found behavior as an unpublished one", async () => {
    const detail = await buildPublicGuideDetail({ guides }, "does-not-exist");
    expect(detail).toBeNull();
  });

  it("never leaks a DRAFT guide's content, even if the slug is guessed correctly", async () => {
    await guides.create(
      baseGuideInput({
        slug: "unreviewed-draft",
        status: "DRAFT",
        body: "Internal draft content not yet approved for publication.",
      })
    );
    const detail = await buildPublicGuideDetail({ guides }, "unreviewed-draft");
    expect(detail).toBeNull();
  });
});
