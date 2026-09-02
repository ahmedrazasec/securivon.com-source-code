import Link from "next/link";

const SERVICE_LINKS = [
  { href: "/services/cctv-installation", label: "CCTV & IP Camera Installation" },
  { href: "/services/cctv-repair-maintenance", label: "CCTV Repair & Maintenance" },
  { href: "/services/access-control", label: "Access Control & Biometric Systems" },
  { href: "/services/fire-alarm", label: "Fire Alarm Systems" },
  { href: "/services/networking", label: "Networking & Structured Cabling" },
] as const;

const COMPANY_LINKS = [
  { href: "/about", label: "About Securivon" },
  { href: "/products", label: "Products" },
  { href: "/packages", label: "Packages" },
  { href: "/guides", label: "Resources" },
  { href: "/request-quote", label: "Request a Quote" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line-dark bg-ink text-slate-onink">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="font-display text-lg font-semibold text-paper">Securivon</span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              CCTV &amp; security solutions for homes and businesses across Pakistan — installation,
              maintenance, and support.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-paper">Services</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {SERVICE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-paper">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-paper">Company</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-paper">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-paper">Get in touch</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="https://wa.me/923110597513" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-paper">
                  WhatsApp: +92 311 0597513
                </a>
              </li>
              <li>
                <a href="tel:+923110597513" className="transition-colors hover:text-paper">
                  Call: +92 311 0597513
                </a>
              </li>
              <li>
                <a href="mailto:securivon@gmail.com" className="transition-colors hover:text-paper">
                  securivon@gmail.com
                </a>
              </li>
              <li className="pt-1 text-slate-onink/70">Serving customers across Pakistan</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line-dark pt-6 text-xs text-slate-onink/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Securivon. All rights reserved.</p>
          <p>Pricing shown, where available, is an estimate — final quotation confirmed after site survey.</p>
        </div>
      </div>
    </footer>
  );
}
