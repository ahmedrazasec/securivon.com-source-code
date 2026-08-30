import type { NextConfig } from "next";

/**
 * Baseline security headers — applied to every route (public + admin) via
 * Next.js's built-in `headers()` config, which the framework applies to
 * every response, including redirects (relevant since src/proxy.ts
 * redirects unauthenticated /admin visits to /login).
 *
 * Audited against actual current usage before writing this policy (not a
 * generic template):
 *   - No external scripts, analytics, or third-party embeds anywhere in
 *     the app (self-hosted fonts via next/font/local, no CDN scripts).
 *   - JSON-LD (src/components/seo/JsonLd.tsx) renders inline
 *     <script type="application/ld+json"> tags — this is why script-src
 *     needs 'unsafe-inline' rather than a strict script-src 'self' with no
 *     inline allowance. A nonce-based CSP would let us drop
 *     'unsafe-inline', but wiring per-request nonces through src/proxy.ts
 *     and every inline script correctly needs live browser verification
 *     this sandbox can't perform (this app doesn't even fully build here —
 *     see the Prisma-generation limitation noted throughout prior
 *     batches) — left as a documented, deliberate P2 follow-up, not
 *     attempted blind.
 *   - Product images (src/components/*ProductCard*) are plain <img> tags
 *     with admin-entered URLs from arbitrary supplier hosts — there's no
 *     fixed, known-in-advance set of image domains to allowlist, so img-src
 *     allows any https origin rather than a specific list.
 *   - No client ever talks to Supabase directly — all DB access is
 *     server-side only (Prisma + @prisma/adapter-pg) — so connect-src can
 *     stay locked to 'self' with no Supabase-specific carve-out needed.
 *   - Forms (Request Quote, Configurator, admin forms) all submit to
 *     same-origin /api/* routes only.
 *
 * CSP differs between development and production ONLY in one respect:
 * 'unsafe-eval' is added to script-src in development because Next.js's
 * dev-mode Fast Refresh/HMR needs it — production builds don't. Everything
 * else is identical, so what you test locally matches what ships.
 */

const isProd = process.env.NODE_ENV === "production";

function buildCsp(): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", ...(isProd ? [] : ["'unsafe-eval'"])].join(" ");
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildCsp() },
  // Defense-in-depth alongside frame-ancestors 'none' above — older
  // browsers that don't support CSP frame-ancestors still respect this.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing in this app uses any of these browser features — deny all of
  // them rather than leaving the default (which allows same-origin use).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Only meaningful over HTTPS anyway (browsers ignore this header when
  // received over plain HTTP), but gated to production regardless, per
  // the explicit requirement not to create local-dev friction.
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
