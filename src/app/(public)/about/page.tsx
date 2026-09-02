import type { Metadata } from "next";
import { Container } from "@/components/marketing/Primitives";
import { Button, Badge } from "@/components/marketing/ui";
import { ServiceIcon } from "@/components/marketing/ServiceIcon";
import { SERVICES } from "@/lib/marketing/services";

export const metadata: Metadata = {
  title: "About",
  description: "Securivon is a CCTV and security solutions company serving customers across Pakistan.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <div className="border-b border-line bg-paper-raised">
        <Container className="py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">About Securivon</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            CCTV &amp; security solutions, planned around your property
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate">
            Securivon provides CCTV, access control, fire alarm, video intercom, intrusion detection, and
            networking solutions for homes and businesses across Pakistan, starting with Islamabad and
            Rawalpindi.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button href="/request-quote">Request a Quote</Button>
            <Button href="https://wa.me/923110597513" external variant="ghost">
              Chat on WhatsApp →
            </Button>
          </div>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">How we work</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate">
              We install, configure, repair, and maintain security systems — from a single-camera home setup
              to multi-floor commercial installations. Every system is planned around the property it&rsquo;s
              protecting, with pricing that&rsquo;s either an estimate you can trust or a final quotation
              confirmed after a site survey.
            </p>

            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-ink">What we do</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SERVICES.map((service) => (
                <div key={service.slug} className="flex items-start gap-3 rounded-lg border border-line bg-paper-raised p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-paper text-ink">
                    <ServiceIcon slug={service.slug} className="h-5 w-5" />
                  </span>
                  <span className="text-sm leading-relaxed text-ink">{service.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-line bg-paper-raised p-5">
              <h2 className="text-sm font-semibold text-ink">Founded by</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate">Ahmed Raza</p>
              <Badge tone="neutral" className="mt-3">
                Serving Islamabad &amp; Rawalpindi
              </Badge>
            </div>

            <div className="rounded-lg border border-line bg-paper-raised p-5">
              <h2 className="text-sm font-semibold text-ink">Get in touch</h2>
              <div className="mt-3 space-y-2 text-sm">
                <a href="https://wa.me/923110597513" target="_blank" rel="noopener noreferrer" className="block text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                  WhatsApp: +92 311 0597513
                </a>
                <a href="mailto:securivon@gmail.com" className="block text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                  securivon@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
