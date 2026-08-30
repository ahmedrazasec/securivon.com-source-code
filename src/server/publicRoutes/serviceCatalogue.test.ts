import { describe, it, expect, beforeEach } from "vitest";
import { buildPublicServiceCatalogue, buildPublicServiceDetail } from "@/server/publicRoutes/serviceCatalogue";
import { InMemoryServiceRepository } from "@test-fakes/repositories";
import type { ServiceCreateInput } from "@/server/repositories/types";

function baseServiceInput(overrides: Partial<ServiceCreateInput> = {}): ServiceCreateInput {
  return {
    slug: "cctv-installation",
    name: "CCTV & IP Camera Installation",
    shortDescription: "Camera selection, placement, and installation for full property coverage.",
    quoteOnly: false,
    problemText: "Blind spots and poorly placed cameras mean a system that looks installed but isn't.",
    solutionText: "We plan camera placement around your property's actual layout and risk areas.",
    suitableCustomersText: "Homes\nShops and retail\nRestaurants",
    featuresText: "IP or analog HD cameras\nDVR/NVR recorder\nStorage",
    processText: null,
    equipmentText: null,
    warrantyText: null,
    considerationsText: "Camera count and cable runs affect cost.",
    faq: null,
    seoTitle: null,
    seoDescription: null,
    status: "PUBLISHED",
    ...overrides,
  };
}

describe("buildPublicServiceCatalogue", () => {
  let services: InMemoryServiceRepository;

  beforeEach(() => {
    services = new InMemoryServiceRepository();
  });

  it("includes a PUBLISHED service", async () => {
    await services.create(baseServiceInput());
    const catalogue = await buildPublicServiceCatalogue({ services });
    expect(catalogue).toHaveLength(1);
    expect(catalogue[0].slug).toBe("cctv-installation");
  });

  it("excludes a DRAFT service", async () => {
    await services.create(baseServiceInput({ slug: "draft-service", status: "DRAFT" }));
    const catalogue = await buildPublicServiceCatalogue({ services });
    expect(catalogue).toHaveLength(0);
  });

  it("excludes an ARCHIVED service", async () => {
    await services.create(baseServiceInput({ slug: "archived-service", status: "ARCHIVED" }));
    const catalogue = await buildPublicServiceCatalogue({ services });
    expect(catalogue).toHaveLength(0);
  });

  it("returns only allowlisted listing fields, never internal-only columns like faq/timestamps", async () => {
    await services.create(baseServiceInput({ faq: { q: "internal draft FAQ, not yet reviewed" } }));
    const catalogue = await buildPublicServiceCatalogue({ services });
    const listing = catalogue[0] as unknown as Record<string, unknown>;
    expect(listing.faq).toBeUndefined();
    expect(listing.createdAt).toBeUndefined();
    expect(listing.updatedAt).toBeUndefined();
    expect(listing.status).toBeUndefined();
  });
});

describe("buildPublicServiceDetail", () => {
  let services: InMemoryServiceRepository;

  beforeEach(() => {
    services = new InMemoryServiceRepository();
  });

  it("returns full detail for a PUBLISHED service, with text fields split into lists", async () => {
    await services.create(baseServiceInput());
    const detail = await buildPublicServiceDetail({ services }, "cctv-installation");
    expect(detail).not.toBeNull();
    expect(detail?.name).toBe("CCTV & IP Camera Installation");
    expect(detail?.suitableFor).toEqual(["Homes", "Shops and retail", "Restaurants"]);
    expect(detail?.components).toEqual(["IP or analog HD cameras", "DVR/NVR recorder", "Storage"]);
    expect(detail?.considerations).toBe("Camera count and cable runs affect cost.");
  });

  it("returns null for a DRAFT service (not yet publicly visible)", async () => {
    await services.create(baseServiceInput({ slug: "draft-service", status: "DRAFT" }));
    const detail = await buildPublicServiceDetail({ services }, "draft-service");
    expect(detail).toBeNull();
  });

  it("returns null for an ARCHIVED service", async () => {
    await services.create(baseServiceInput({ slug: "archived-service", status: "ARCHIVED" }));
    const detail = await buildPublicServiceDetail({ services }, "archived-service");
    expect(detail).toBeNull();
  });

  it("returns null for a nonexistent slug — same not-found behavior as an unpublished one", async () => {
    const detail = await buildPublicServiceDetail({ services }, "does-not-exist");
    expect(detail).toBeNull();
  });

  it("handles empty suitableCustomersText/featuresText as empty lists, not a crash", async () => {
    await services.create(baseServiceInput({ slug: "minimal-service", suitableCustomersText: null, featuresText: "" }));
    const detail = await buildPublicServiceDetail({ services }, "minimal-service");
    expect(detail?.suitableFor).toEqual([]);
    expect(detail?.components).toEqual([]);
  });
});
