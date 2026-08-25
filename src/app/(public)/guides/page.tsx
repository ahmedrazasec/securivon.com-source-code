import type { Metadata } from "next";
import { Container } from "@/components/marketing/Primitives";

export const metadata: Metadata = {
  title: "Resources",
  description: "Guides and resources on CCTV and security systems from Securivon.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <Container className="max-w-2xl py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Resources</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Guides coming soon</h1>
      <p className="mt-4 text-sm leading-relaxed text-slate">
        We&rsquo;re working on practical guides for choosing and planning security systems. Check back soon.
      </p>
    </Container>
  );
}
