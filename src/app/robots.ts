import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Real robots.txt via Next.js's built-in MetadataRoute.Robots API — no
 * extra package needed. Served at /robots.txt automatically because this
 * file is named robots.ts under src/app/.
 *
 * Disallows /admin (the entire Admin dashboard — auth-gated anyway, but
 * crawlers shouldn't waste budget or accidentally index a login page) and
 * /api (not HTML content at all — includes both the public /api/leads,
 * /api/configurator endpoints and every /api/admin/** route). Everything
 * else under the public site is allowed by omission.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
