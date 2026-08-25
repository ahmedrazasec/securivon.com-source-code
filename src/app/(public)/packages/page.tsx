import type { Metadata } from "next";
import { Container } from "@/components/marketing/Primitives";

export const metadata: Metadata = {
  title: "Packages",
  description: "Compare CCTV and security packages from Securivon.",
  alternates: { canonical: "/packages" },
};

/**
 * Placeholder — same reasoning as products/page.tsx. The Admin Package
 * system is live, but no real, verified packages exist in the database
 * yet (only test/verification data from Phase 4 activation). Build the
 * real listing + comparison view once actual packages are entered.
 */
export default function PackagesPage() {
  return (
    <Container className="max-w-2xl py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Packages</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Packages coming soon
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-slate">
        We&rsquo;re putting together ready-made packages for common setups. Until then, request a quote and
        we&rsquo;ll put one together for your property directly.
      </p>
      <a
        href="/request-quote"
        className="mt-8 inline-block rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
      >
        Get a Quote
      </a>
    </Container>
  );
}
