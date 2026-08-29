import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Root layout.
 *
 * Deliberately minimal — fonts, metadataBase, and organization-level
 * JSON-LD only. Site chrome (header/footer) lives in
 * src/app/(public)/layout.tsx via a route group, so /admin/** (which has
 * its own AdminNav) isn't wrapped in marketing navigation. Route groups
 * don't affect the URL: (public)/page.tsx serves at "/" (there is
 * deliberately no other src/app/page.tsx — a stray one previously shadowed
 * it and was removed as part of the SEO foundations batch).
 *
 * Fonts are self-hosted via next/font/local, not next/font/google — the
 * Google Fonts CDN approach failed identically on both the sandbox and the
 * real Windows dev machine ("issue establishing a connection... fonts.
 * googleapis.com"), so this isn't a sandbox-only workaround being deferred
 * for later; it's the actual fix, verified as the fix by removing the
 * network dependency entirely. Files are the official variable-font TTFs
 * from Google's own open-source font repository (github.com/google/fonts),
 * SIL Open Font License (see src/app/fonts/*-OFL.txt) — same fonts,
 * self-hosted, zero build-time network calls.
 */

const spaceGrotesk = localFont({
  src: "./fonts/SpaceGrotesk-Variable.ttf",
  weight: "300 700",
  variable: "--font-space-grotesk",
  display: "swap",
});

const ibmPlexSans = localFont({
  src: "./fonts/IBMPlexSans-Variable.ttf",
  weight: "400 700",
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Securivon — CCTV & Security Solutions in Pakistan",
    template: "%s — Securivon",
  },
  description:
    "Professional CCTV, surveillance, access control, and security system installation and maintenance across Pakistan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${spaceGrotesk.variable} ${ibmPlexSans.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
