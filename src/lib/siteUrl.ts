/**
 * Single source of truth for the site's canonical production origin — used
 * by root layout's `metadataBase` (so the relative canonical/OpenGraph
 * URLs already set on every public page resolve to real absolute URLs
 * instead of localhost), sitemap.ts, robots.ts, and the JSON-LD builders.
 *
 * Falls back to the real production domain from README.md ("Website:
 * securivon.com") rather than localhost, so a misconfigured/missing env
 * var in production fails safe (real domain) rather than fails silent
 * (localhost URLs shipped to Google).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://securivon.com").replace(/\/+$/, "");
