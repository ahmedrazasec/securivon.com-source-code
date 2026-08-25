import type { Metadata } from "next";
import { Container } from "@/components/marketing/Primitives";

export const metadata: Metadata = {
  title: "About",
  description: "Securivon is a CCTV and security solutions company serving customers across Pakistan.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container className="max-w-2xl py-14 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">About</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        CCTV &amp; security solutions, planned around your property
      </h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-slate">
        <p>
          Securivon provides CCTV, access control, fire alarm, video intercom, intrusion detection, and
          networking solutions for homes and businesses across Pakistan, starting with Islamabad and
          Rawalpindi.
        </p>
        <p>
          We install, configure, repair, and maintain security systems — from a single-camera home setup
          to multi-floor commercial installations. Every system is planned around the property it&rsquo;s
          protecting, with pricing that&rsquo;s either an estimate you can trust or a final quotation confirmed
          after a site survey.
        </p>
        <p>Founded by Ahmed Raza.</p>
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-line pt-8">
        <a
          href="https://wa.me/923110597513"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
        >
          Chat on WhatsApp
        </a>
        <a href="mailto:securivon@gmail.com" className="text-sm font-semibold text-ink underline decoration-line underline-offset-4">
          securivon@gmail.com
        </a>
      </div>
    </Container>
  );
}
