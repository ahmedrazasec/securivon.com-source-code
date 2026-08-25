import type { Metadata } from "next";
import { Container } from "@/components/marketing/Primitives";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse CCTV cameras, recorders, and security equipment from Securivon.",
  alternates: { canonical: "/products" },
};

/**
 * Placeholder. The Admin product catalogue is live (Phase 4), but a public
 * product listing needs its own careful pass — a public-safe serializer
 * that guarantees supplierCost/supplierId/sourceUrl never reach this page,
 * plus filtering to only PUBLISHED + VERIFIED-pricing products. Building
 * that quickly risks exactly the kind of leak this project has been
 * careful to prevent everywhere else, so it's deliberately not rushed here.
 */
export default function ProductsPage() {
  return (
    <Container className="max-w-2xl py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Products</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Product catalogue coming soon
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-slate">
        We&rsquo;re still building out our public product catalogue. In the meantime, message us on WhatsApp
        or request a quote and we&rsquo;ll recommend the right equipment for your property.
      </p>
      <a
        href="https://wa.me/923110597513"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
      >
        Chat on WhatsApp
      </a>
    </Container>
  );
}
