import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/marketing/Primitives";
import { SERVICES, getServiceBySlug } from "@/lib/marketing/services";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: service.name,
    description: service.shortDescription,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <Container className="max-w-3xl py-14 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Service</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{service.name}</h1>
      <p className="mt-4 text-base leading-relaxed text-slate">{service.problem}</p>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">How we solve it</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">{service.solution}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Suitable for</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {service.suitableFor.map((item) => (
              <li key={item} className="rounded-full border border-line bg-paper-raised px-3 py-1 text-xs text-slate">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">What&rsquo;s typically involved</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-slate">
            {service.components.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-line bg-paper-raised p-5">
          <h2 className="text-sm font-semibold text-ink">Good to know</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">{service.considerations}</p>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-line pt-8">
        <Link
          href="/request-quote"
          className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
        >
          Get a Quote
        </Link>
        <a
          href="https://wa.me/923110597513"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          Chat on WhatsApp →
        </a>
      </div>
    </Container>
  );
}
