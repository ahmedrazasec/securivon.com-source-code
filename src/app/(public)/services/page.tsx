import type { Metadata } from "next";
import Link from "next/link";
import { Container, SectionHeading } from "@/components/marketing/Primitives";
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
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="group rounded-lg border border-line bg-paper-raised p-6 transition-colors hover:border-accent"
          >
            <h2 className="text-base font-semibold text-ink group-hover:text-accent-strong">{service.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">{service.shortDescription}</p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
