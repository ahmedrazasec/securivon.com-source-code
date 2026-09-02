import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Primitives";
import { Button, Badge } from "@/components/marketing/ui";
import { ServiceIcon } from "@/components/marketing/ServiceIcon";
import { getPublicServiceBySlug } from "@/server/publicRoutes/services";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildServiceJsonLd } from "@/lib/seo/structuredData";

// Real, database-backed content now (was static SERVICES + generateStaticParams)
// — dynamic per-request, matching /products/[slug] and /packages/[slug], so an
// admin edit or newly-published service is live immediately.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);
  if (!service) return {};
  return {
    title: service.seoTitle ?? service.name,
    description: service.seoDescription ?? service.shortDescription ?? undefined,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);
  if (!service) notFound();

  const leadText = service.problem ?? service.shortDescription;

  return (
    <>
      <JsonLd data={buildServiceJsonLd(service)} />

      {/* Hero */}
      <div className="border-b border-line bg-paper-raised">
        <Container className="py-14 sm:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-ink">
              <ServiceIcon slug={service.slug} className="h-8 w-8" />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Security Service</p>
                {service.quoteOnly && <Badge tone="neutral">Quote only — no fixed price</Badge>}
              </div>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {service.name}
              </h1>
              {leadText && <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate">{leadText}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button href="/request-quote">Request a Quote</Button>
                <Button href="https://wa.me/923110597513" external variant="ghost">
                  Chat on WhatsApp →
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
          {/* Main column */}
          <div className="space-y-10">
            {service.solution && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">How we solve it</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate">{service.solution}</p>
              </section>
            )}

            {service.components.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">What we provide</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {service.components.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-lg border border-line bg-paper-raised p-4">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
                      <span className="text-sm leading-relaxed text-ink">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {service.suitableFor.length > 0 && (
              <div className="rounded-lg border border-line bg-paper-raised p-5">
                <h2 className="text-sm font-semibold text-ink">Suitable for</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {service.suitableFor.map((item) => (
                    <Badge key={item} tone="accent">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {service.considerations && (
              <div className="rounded-lg border border-line bg-paper p-5">
                <h2 className="text-sm font-semibold text-ink">Good to know</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate">{service.considerations}</p>
              </div>
            )}

            <div className="rounded-lg border border-line bg-paper-raised p-5">
              <h2 className="text-sm font-semibold text-ink">Ready to get started?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Tell us about your property and we&rsquo;ll get back to you with next steps.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Button href="/request-quote" className="w-full">
                  Request a Quote
                </Button>
                <Button href="https://wa.me/923110597513" external variant="secondary" className="w-full">
                  Chat on WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
