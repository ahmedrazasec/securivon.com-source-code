import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/Primitives";
import { Button } from "@/components/marketing/ui";
import { GuideCard } from "@/components/marketing/GuideCard";
import { getPublicGuideBySlug, getPublicGuideCatalogue } from "@/server/publicRoutes/guides";
import { parseGuideBody } from "@/lib/marketing/guideContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildGuideJsonLd } from "@/lib/seo/structuredData";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPublicGuideBySlug(slug);
  if (!guide) return {};
  return {
    title: guide.seoTitle ?? guide.title,
    description: guide.seoDescription ?? guide.excerpt,
    alternates: { canonical: `/guides/${guide.slug}` },
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getPublicGuideBySlug(slug);
  if (!guide) notFound();

  const blocks = parseGuideBody(guide.body);
  const coverImage = guide.images[0];

  // "More guides", not "Related guides" — there's no category/relationship
  // field on Guide to base a real recommendation on, so this is an honest
  // navigational list rather than a claimed content relationship. Omitted
  // entirely when there's nothing else to show (Phase 10 requirement).
  const allGuides = await getPublicGuideCatalogue();
  const moreGuides = allGuides.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={buildGuideJsonLd(guide)} />

      <div className="border-b border-line bg-paper-raised">
        <Container className="py-14 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Guide</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {guide.title}
          </h1>
          {guide.excerpt && <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate">{guide.excerpt}</p>}
          <p className="mt-4 text-xs text-slate">
            {guide.readingTimeMinutes} min read
            {guide.publishedAt && (
              <>
                {" · "}
                {new Date(guide.publishedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
              </>
            )}
          </p>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
          <article className="max-w-2xl">
            {coverImage && (
              <div className="mb-8 overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered image source, arbitrary host */}
                <img src={coverImage.url} alt={coverImage.alt ?? guide.title} className="aspect-[16/9] w-full object-cover" />
              </div>
            )}

            <div className="space-y-6">
              {blocks.map((block, i) => {
                if (block.type === "heading") {
                  return (
                    <h2 key={i} className="pt-2 text-lg font-semibold text-ink">
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === "list") {
                  return (
                    <ul key={i} className="space-y-2 rounded-lg border border-line bg-paper-raised p-5">
                      {block.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="text-sm leading-relaxed text-slate">
                    {block.text}
                  </p>
                );
              })}
            </div>
          </article>

          <div className="space-y-6">
            <div className="rounded-lg border border-line bg-paper-raised p-5">
              <h2 className="text-sm font-semibold text-ink">Need help choosing the right setup?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Answer a few questions and get an estimate, or tell us about your property directly.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Button href="/configurator" className="w-full">
                  Use the Configurator
                </Button>
                <Button href="/request-quote" variant="secondary" className="w-full">
                  Request a Quote
                </Button>
              </div>
            </div>
          </div>
        </div>

        {moreGuides.length > 0 && (
          <div className="mt-16 border-t border-line pt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">More guides</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {moreGuides.map((g) => (
                <GuideCard key={g.id} guide={g} />
              ))}
            </div>
          </div>
        )}
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
