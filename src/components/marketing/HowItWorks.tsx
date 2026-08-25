import { Container, SectionHeading } from "@/components/marketing/Primitives";

const STEPS = [
  {
    n: "01",
    title: "Tell us what you need",
    description: "Message us on WhatsApp or request a quote with a few details about your property.",
  },
  {
    n: "02",
    title: "Estimate or site survey",
    description:
      "Simple setups get an estimated price right away. Larger or more complex properties get a site survey before a final quotation.",
  },
  {
    n: "03",
    title: "Approve & install",
    description: "Once you confirm the final quotation, we schedule installation and configuration.",
  },
  {
    n: "04",
    title: "Ongoing support",
    description: "Maintenance and annual maintenance contracts keep your system working when you need it.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="border-y border-line bg-paper-raised py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Process" title="How it works" />
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n}>
              <span className="font-display text-3xl font-semibold text-line">{step.n}</span>
              <h3 className="mt-3 text-sm font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
