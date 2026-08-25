import Link from "next/link";
import { Container, SectionHeading } from "@/components/marketing/Primitives";

const SOLUTIONS = [
  {
    slug: "cctv-installation",
    name: "CCTV & IP Camera Installation",
    description: "Camera selection, placement, and installation for full property coverage.",
  },
  {
    slug: "cctv-repair-maintenance",
    name: "CCTV Repair & Maintenance",
    description: "Diagnostics and repair for existing DVR, NVR, and camera systems.",
  },
  {
    slug: "access-control",
    name: "Access Control & Biometric Systems",
    description: "Door access, biometric attendance, and entry-management systems.",
  },
  {
    slug: "fire-alarm",
    name: "Fire Alarm Systems",
    description: "Detection and alarm systems for homes, shops, and commercial properties.",
  },
  {
    slug: "video-intercom",
    name: "Video Intercom",
    description: "Door-phone and video intercom systems for houses and apartment buildings.",
  },
  {
    slug: "intrusion-security",
    name: "Intrusion & Security Systems",
    description: "Alarm and intrusion-detection systems for perimeter and interior protection.",
  },
  {
    slug: "networking",
    name: "Networking & Structured Cabling",
    description: "PoE networking and structured cabling to support your security systems.",
  },
  {
    slug: "maintenance-amc",
    name: "Maintenance & AMC",
    description: "Ongoing maintenance and annual maintenance contracts to keep systems running.",
  },
] as const;

export function CoreSolutions() {
  return (
    <section className="bg-paper py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="What we do"
          title="Core security solutions"
          description="Every system starts with your property and your risk — not a fixed package."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOLUTIONS.map((solution) => (
            <Link
              key={solution.slug}
              href={`/services/${solution.slug}`}
              className="group rounded-lg border border-line bg-paper-raised p-5 transition-colors hover:border-accent"
            >
              <h3 className="text-sm font-semibold text-ink group-hover:text-accent-strong">{solution.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{solution.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
