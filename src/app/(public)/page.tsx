import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { CoreSolutions } from "@/components/marketing/CoreSolutions";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Positioning } from "@/components/marketing/Positioning";
import { Faq } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";

export const metadata: Metadata = {
  title: "CCTV & Security Solutions in Pakistan",
  description:
    "Securivon installs and maintains CCTV, access control, fire alarm, and networking systems for homes and businesses across Pakistan. Get an estimate or request a quote today.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Securivon — CCTV & Security Solutions in Pakistan",
    description:
      "Professional CCTV, access control, fire alarm, and security system installation and maintenance across Pakistan.",
    url: "/",
    siteName: "Securivon",
    locale: "en_PK",
    type: "website",
  },
};

/**
 * Homepage.
 *
 * Deliberately does NOT include a "featured packages" section — the
 * securivon-web-design skill recommends one, but there is no verified
 * Package data in the database yet (only test/verification rows created
 * during Phase 4 activation). Showing packages here would mean either
 * fabricating content or surfacing test data as if it were real —
 * both against project rules. Add this section once real, verified
 * packages exist in the Admin system.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <CoreSolutions />
      <HowItWorks />
      <Positioning />
      <Faq />
      <FinalCta />
    </>
  );
}
