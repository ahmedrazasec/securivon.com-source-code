import { describe, it, expect } from "vitest";
import { buildSitemapEntries, toAbsoluteSitemap, type SitemapDeps } from "@/lib/seo/sitemapEntries";

const fakeDeps: SitemapDeps = {
  getProducts: async () => ({ products: [{ slug: "dahua-ipc-hfw2431s" }, { slug: "hikvision-ds-7608" }] }),
  getPackages: async () => [{ slug: "home-starter-4cam" }, { slug: "shop-retail-8cam" }],
  getServices: async () => [{ slug: "cctv-installation" }, { slug: "fire-alarm" }],
  getGuides: async () => [{ slug: "how-many-cctv-cameras-do-i-need" }, { slug: "cctv-vs-ip-cameras" }],
};

const emptyDeps: SitemapDeps = {
  getProducts: async () => ({ products: [] }),
  getPackages: async () => [],
  getServices: async () => [],
  getGuides: async () => [],
};

describe("buildSitemapEntries", () => {
  it("always includes the core static public pages", async () => {
    const entries = await buildSitemapEntries(emptyDeps);
    const urls = entries.map((e) => e.url);
    expect(urls).toEqual(
      expect.arrayContaining(["/", "/about", "/services", "/products", "/packages", "/configurator", "/request-quote", "/guides"])
    );
  });

  it("never includes admin, api, or any non-public route — by construction, nothing here ever builds one", async () => {
    const entries = await buildSitemapEntries(fakeDeps);
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.startsWith("/admin"))).toBe(false);
    expect(urls.some((u) => u.startsWith("/api"))).toBe(false);
  });

  it("includes every published product slug returned by the catalogue reader", async () => {
    const entries = await buildSitemapEntries(fakeDeps);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("/products/dahua-ipc-hfw2431s");
    expect(urls).toContain("/products/hikvision-ds-7608");
  });

  it("includes every published package slug returned by the catalogue reader", async () => {
    const entries = await buildSitemapEntries(fakeDeps);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("/packages/home-starter-4cam");
    expect(urls).toContain("/packages/shop-retail-8cam");
  });

  it("includes every currently published service slug returned by the catalogue reader", async () => {
    const entries = await buildSitemapEntries(fakeDeps);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("/services/cctv-installation");
    expect(urls).toContain("/services/fire-alarm");
  });

  it("includes every currently published guide slug returned by the catalogue reader", async () => {
    const entries = await buildSitemapEntries(fakeDeps);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("/guides/how-many-cctv-cameras-do-i-need");
    expect(urls).toContain("/guides/cctv-vs-ip-cameras");
  });

  it("produces no guide entries beyond the static /guides page when nothing is published yet", async () => {
    const entries = await buildSitemapEntries(emptyDeps);
    const urls = entries.map((e) => e.url);
    expect(urls.filter((u) => u.startsWith("/guides/")).length).toBe(0);
    expect(urls).toContain("/guides"); // the static listing page itself still belongs in the sitemap
  });

  it("produces no service entries when the catalogue reader returns nothing (e.g. nothing published yet)", async () => {
    const entries = await buildSitemapEntries(emptyDeps);
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.startsWith("/services/"))).toBe(false);
  });

  it("produces no product/package entries when the catalogue readers return nothing (e.g. nothing published yet)", async () => {
    const entries = await buildSitemapEntries(emptyDeps);
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.startsWith("/products/"))).toBe(false);
    expect(urls.some((u) => u.startsWith("/packages/"))).toBe(false);
  });
});

describe("toAbsoluteSitemap", () => {
  it("prefixes every entry with the site origin", () => {
    const result = toAbsoluteSitemap([{ url: "/products/x" }, { url: "/" }]);
    for (const entry of result) {
      expect(entry.url.startsWith("http")).toBe(true);
    }
    expect(result.find((e) => e.url.endsWith("/products/x"))).toBeTruthy();
  });
});
