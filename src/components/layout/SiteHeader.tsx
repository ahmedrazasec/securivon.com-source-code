"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/configurator", label: "Configurator" },
  { href: "/products", label: "Products" },
  { href: "/packages", label: "Packages" },
  { href: "/about", label: "About" },
  { href: "/guides", label: "Resources" },
] as const;

const WHATSAPP_NUMBER = "923110597513"; // Securivon — +92 311 0597513, wa.me format (no +, no leading 0)

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">Securivon</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate transition-colors hover:text-ink"
          >
            WhatsApp
          </a>
          <Link
            href="/request-quote"
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
          >
            Get a Quote
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-md text-ink md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-paper md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper-raised"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper-raised"
            >
              WhatsApp
            </a>
            <Link
              href="/request-quote"
              className="mt-2 rounded-md bg-ink px-3 py-2.5 text-center text-sm font-semibold text-paper"
              onClick={() => setMenuOpen(false)}
            >
              Get a Quote
            </Link>
          </nav>
        </div>
      )}

      {/* Persistent WhatsApp action on mobile — always reachable, per fixed UX decision: no bottom nav bar. */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 md:hidden"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.53 3.69-8.22 8.24-8.22 2.2 0 4.27.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.81c0 4.53-3.69 8.21-8.22 8.21Zm4.5-6.15c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.71-.14-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01-.16 0-.43.06-.65.31-.23.24-.85.83-.85 2.03s.87 2.36 1 2.52c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.08.14-1.18-.06-.1-.22-.17-.47-.29Z" />
        </svg>
      </a>
    </header>
  );
}
