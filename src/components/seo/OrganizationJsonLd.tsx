import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Site-wide Organization + WebSite JSON-LD, rendered once in
 * src/app/(public)/layout.tsx (customer-facing pages only — not /admin).
 *
 * Every field here is real, already-live information pulled from
 * src/components/layout/SiteFooter.tsx (phone, email) — not invented, and
 * not copied from README.md in case that's gone stale. Deliberately
 * omitted: `logo` (no real logo asset exists in this repo — see
 * public/ — fabricating one would violate the "never invent facts" rule),
 * `address` (no street address is published anywhere on the live site),
 * and `sameAs` (no verified social profile URLs exist yet). Add these only
 * once the corresponding real asset/fact exists.
 */
export function OrganizationJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Securivon",
    url: SITE_URL,
    description: "Professional CCTV, surveillance, access control, and security system installation and maintenance across Pakistan.",
    telephone: "+92-311-0597513",
    email: "securivon@gmail.com",
    areaServed: "PK",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Securivon",
    url: SITE_URL,
  };

  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={website} />
    </>
  );
}
