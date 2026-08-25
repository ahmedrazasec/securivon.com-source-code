import Link from "next/link";
import { Container } from "@/components/marketing/Primitives";

export function FinalCta() {
  return (
    <section className="bg-ink py-16 sm:py-20">
      <Container className="text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Ready to secure your property?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-onink">
          Tell us about your property and we&rsquo;ll get back to you with next steps — no obligation.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/request-quote"
            className="rounded-md bg-paper px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-soft"
          >
            Get a Quote
          </Link>
          <a
            href="https://wa.me/923110597513"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-paper underline decoration-line-dark underline-offset-4 hover:decoration-paper"
          >
            Chat on WhatsApp →
          </a>
        </div>
      </Container>
    </section>
  );
}
