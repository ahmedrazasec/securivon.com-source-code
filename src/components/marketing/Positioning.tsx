import { Container, SectionHeading } from "@/components/marketing/Primitives";

const POINTS = [
  {
    title: "Estimate vs. final quotation",
    description:
      "We're upfront about what's a rough estimate and what's a confirmed price. Complex jobs get a proper site survey before you commit.",
  },
  {
    title: "Contact us the way you prefer",
    description: "WhatsApp, phone call, or a quote form — whichever is easiest for you.",
  },
  {
    title: "One point of contact",
    description: "From your first message through installation and any maintenance after.",
  },
] as const;

export function Positioning() {
  return (
    <section className="bg-paper py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Why Securivon" title="Straightforward, from quote to installation" align="center" />
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          {POINTS.map((point) => (
            <div key={point.title} className="text-center sm:text-left">
              <h3 className="text-sm font-semibold text-ink">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{point.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
