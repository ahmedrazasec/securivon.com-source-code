"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Root error boundary (Next.js file convention) — catches any otherwise
 * unhandled render/runtime error in the public site and shows a branded
 * fallback instead of Next.js's default unstyled error screen. Must be a
 * Client Component (Next.js requirement for error.tsx).
 *
 * Deliberately never renders `error.message`, `error.stack`, or
 * `error.digest` to the page — those can contain internal details (file
 * paths, query fragments, library internals) that shouldn't reach a
 * visitor. `error.digest` is logged to the console only, as a correlation
 * ID for whoever's checking server logs, not shown in the UI.
 *
 * Same "no SiteHeader/SiteFooter" situation as not-found.tsx — this is a
 * root-level file, outside the (public) route group's layout — so it
 * includes its own minimal branded chrome.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error boundary:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-20 text-center">
      <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
        Securivon
      </Link>

      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Something went wrong</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        We hit a snag loading this page
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate">
        This has been logged on our end. Please try again, or head back to the homepage — if the problem
        continues, reach us on WhatsApp and we&rsquo;ll help directly.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-line bg-paper-raised px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent"
        >
          Go to homepage
        </Link>
        <a
          href="https://wa.me/923110597513"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-line bg-paper-raised px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent"
        >
          Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
