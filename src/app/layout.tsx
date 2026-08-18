import type { Metadata } from "next";
import "./globals.css";

/**
 * Root layout — foundation stage only.
 *
 * NOTE: next/font/google (the create-next-app default) fetches font files
 * from fonts.googleapis.com at build time. That domain was not reachable in
 * the sandbox this scaffold was built in, so the default Geist/Geist Mono
 * font loading was removed in favor of a plain system-font stack here.
 * This is not a design decision — the real typeface choice (Space Grotesk +
 * IBM Plex Sans, per Phase 3 §J) is a later UI-development-stage concern,
 * not part of this foundation. Whoever picks that up should evaluate
 * next/font/local (self-hosted, no build-time fetch) as the production
 * approach, since it avoids this exact limitation regardless of environment.
 */

export const metadata: Metadata = {
  title: "Securivon — Production Foundation",
  description: "Securivon CCTV & Security Solutions — production build in progress.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
