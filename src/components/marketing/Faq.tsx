import { Container, SectionHeading } from "@/components/marketing/Primitives";

const FAQS = [
  {
    q: "How does pricing work?",
    a: "Where we have verified pricing for straightforward setups (like a home or small shop), you'll see an estimated price right away. Larger properties, complex cabling, or systems like fire alarms and intrusion detection typically require a site survey before we can give a final quotation.",
  },
  {
    q: "What's the difference between an estimate and a final quotation?",
    a: "An estimate is a starting point based on what you've told us. A final quotation is confirmed after we've reviewed your property — either through the details you provide or an in-person site survey — and it's what you'd actually be charged.",
  },
  {
    q: "Do you offer maintenance after installation?",
    a: "Yes — we offer repair and maintenance for existing systems, plus ongoing annual maintenance contracts (AMC).",
  },
  {
    q: "Where do you operate?",
    a: "We serve customers across Pakistan, starting with Islamabad and Rawalpindi.",
  },
  {
    q: "How do I get started?",
    a: "Message us on WhatsApp or submit a quote request with a few details about your property — we'll take it from there.",
  },
] as const;

export function Faq() {
  return (
    <section className="border-t border-line bg-paper-raised py-16 sm:py-20">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
        <dl className="mt-10 divide-y divide-line">
          {FAQS.map((item) => (
            <div key={item.q} className="py-5">
              <dt className="text-sm font-semibold text-ink">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
