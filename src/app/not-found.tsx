import Link from "next/link";

/**
 * Root not-found page (Next.js file convention). Lives OUTSIDE the
 * (public) route group, so it does NOT get SiteHeader/SiteFooter — the
 * root layout (src/app/layout.tsx) is deliberately just fonts/html/body.
 * This page therefore includes its own minimal, self-contained branded
 * chrome (wordmark + a few links back into the site) rather than reusing
 * SiteHeader — kept intentionally lightweight, not a redesign.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-20 text-center">
      <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
        Securivon
      </Link>

      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        We couldn&rsquo;t find that page
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate">
        The page you&rsquo;re looking for may have moved or no longer exists. Here are a few places to start
        instead.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
        >
          Go to homepage
        </Link>
        <Link
          href="/services"
          className="rounded-md border border-line bg-paper-raised px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent"
        >
          Browse services
        </Link>
        <Link
          href="/request-quote"
          className="rounded-md border border-line bg-paper-raised px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent"
        >
          Get a quote
        </Link>
      </div>
    </div>
  );
}
