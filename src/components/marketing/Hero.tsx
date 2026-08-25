import Link from "next/link";
import { Container } from "@/components/marketing/Primitives";

/**
 * Signature element: a schematic overhead coverage diagram — camera nodes
 * with radiating fields of view over a simple floor-plan grid. Grounded in
 * the actual subject (how CCTV coverage is planned) rather than a generic
 * icon, stock photo of "someone pointing at a monitor," or a cliché
 * shield/lock motif.
 */
function CoverageDiagram() {
  return (
    <svg viewBox="0 0 480 360" className="h-full w-full" role="img" aria-label="Illustration of CCTV camera coverage zones over a property layout">
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#2a3446" strokeWidth="0.75" />
        </pattern>
        <radialGradient id="fov" cx="0" cy="0" r="1">
          <stop offset="0%" stopColor="#0e7490" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0e7490" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="480" height="360" fill="#0b1220" />
      <rect width="480" height="360" fill="url(#grid)" />
      <rect x="40" y="40" width="400" height="280" fill="none" stroke="#3a465c" strokeWidth="1.5" />
      <line x1="40" y1="180" x2="240" y2="180" stroke="#3a465c" strokeWidth="1.5" />
      <line x1="240" y1="40" x2="240" y2="320" stroke="#3a465c" strokeWidth="1.5" />

      {[
        { x: 60, y: 60, r: 210, a1: 20, a2: 110 },
        { x: 420, y: 60, r: 210, a1: 110, a2: 200 },
        { x: 420, y: 300, r: 210, a1: 200, a2: 290 },
        { x: 60, y: 300, r: 210, a1: 290, a2: 380 },
      ].map((cam, i) => {
        const rad1 = (cam.a1 * Math.PI) / 180;
        const rad2 = (cam.a2 * Math.PI) / 180;
        const x1 = cam.x + cam.r * Math.cos(rad1);
        const y1 = cam.y + cam.r * Math.sin(rad1);
        const x2 = cam.x + cam.r * Math.cos(rad2);
        const y2 = cam.y + cam.r * Math.sin(rad2);
        return (
          <g key={i}>
            <path d={`M ${cam.x} ${cam.y} L ${x1} ${y1} A ${cam.r} ${cam.r} 0 0 1 ${x2} ${y2} Z`} fill="url(#fov)" />
            <circle cx={cam.x} cy={cam.y} r="6" fill="#0e7490" />
            <circle cx={cam.x} cy={cam.y} r="10" fill="none" stroke="#0e7490" strokeWidth="1.5" opacity="0.6" />
          </g>
        );
      })}
    </svg>
  );
}

export function Hero() {
  return (
    <section className="border-b border-line bg-paper">
      <Container className="grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
            CCTV &amp; Security Solutions — Pakistan
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Security systems planned around your property, not a price list.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate">
            Securivon installs and maintains CCTV, access control, fire alarm, and networking
            systems for homes and businesses. Tell us what you need to protect — we&rsquo;ll tell you
            what it takes to cover it properly.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/configurator"
              className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
            >
              Get an Estimate
            </Link>
            <a
              href="https://wa.me/923110597513"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              Chat on WhatsApp →
            </a>
          </div>
          <p className="mt-6 text-xs text-slate">
            Estimated price shown where available — final quotation confirmed after site survey.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-line-dark shadow-sm">
          <CoverageDiagram />
        </div>
      </Container>
    </section>
  );
}
