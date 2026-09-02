import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/marketing/Primitives";
import { GuideCard } from "@/components/marketing/GuideCard";
import { Button, Card } from "@/components/marketing/ui";
import { getPublicGuideCatalogue } from "@/server/publicRoutes/guides";

export const metadata: Metadata = {
  title: "Resources",
  description: "Practical guides on choosing and planning CCTV and security systems from Securivon.",
  alternates: { canonical: "/guides" },
};

// Real, database-backed content now (was a static placeholder) — dynamic
// per-request, matching /products, /packages, and /services, so a newly
// published guide is live immediately without a rebuild.
export default async function GuidesPage() {
  const guides = await getPublicGuideCatalogue();

  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading
        eyebrow="Resources"
        title="Guides"
        description="Practical, no-nonsense explanations to help you understand security systems and make better decisions before you buy."
      />

      {guides.length === 0 ? (
        <EmptyGuidesState />
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      )}
    </Container>
  );
}

function EmptyGuidesState() {
  return (
    <Card className="mt-10 p-8 text-center">
      <p className="text-sm font-semibold text-ink">Security knowledge, coming soon.</p>
      <p className="mt-2 text-sm leading-relaxed text-slate">
        We&rsquo;re preparing practical guides on choosing, planning, and understanding CCTV and security
        systems. In the meantime, here&rsquo;s how to get started directly.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Button href="/services">Explore Services</Button>
        <Button href="/configurator" variant="secondary">
          Configure Your System
        </Button>
        <Button href="/request-quote" variant="ghost">
          Request a Quote →
        </Button>
      </div>
    </Card>
  );
}
