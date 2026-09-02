import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/marketing/Primitives";
import { Card, Badge } from "@/components/marketing/ui";
import { ServiceIcon } from "@/components/marketing/ServiceIcon";
import { getPublicServiceCatalogue } from "@/server/publicRoutes/services";

export const metadata: Metadata = {
  title: "Services",
  description: "CCTV, access control, fire alarm, intercom, networking, and maintenance services from Securivon.",
  alternates: { canonical: "/services" },
};

// Real, database-backed content now (was static SERVICES import) — no
// generateStaticParams/force-static here, matching /products and
// /packages, so an admin edit is live immediately rather than only after a
// rebuild.
export default async function ServicesPage() {
  const services = await getPublicServiceCatalogue();

  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading eyebrow="What we do" title="Services" description="Every system starts with your property, not a fixed package." />
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.slug} href={`/services/${service.slug}`} className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-paper text-ink">
                <ServiceIcon slug={service.slug} />
              </span>
              {service.quoteOnly && <Badge tone="neutral">Quote only</Badge>}
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink group-hover:text-accent-strong">{service.name}</h2>
              {service.shortDescription && (
                <p className="mt-2 text-sm leading-relaxed text-slate">{service.shortDescription}</p>
              )}
            </div>
            <span className="mt-auto pt-2 text-xs font-semibold text-accent-strong">Learn more →</span>
          </Card>
        ))}
      </div>
    </Container>
  );
}
