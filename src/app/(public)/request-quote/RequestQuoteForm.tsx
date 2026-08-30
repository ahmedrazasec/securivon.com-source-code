"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/marketing/Primitives";

const PROPERTY_TYPES = [
  { value: "HOME", label: "Home" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "SHOP", label: "Shop" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "OFFICE", label: "Office" },
  { value: "WAREHOUSE", label: "Warehouse / Industrial" },
  { value: "OTHER", label: "Other" },
] as const;

// Maps the Configurator's lowercase property-type values onto this form's
// uppercase ones — a clean 1:1 mapping (the two lists were briefly out of
// sync until this Stage 3C pass added APARTMENT here to match).
const CONFIGURATOR_PROPERTY_TYPE_MAP: Record<string, string> = {
  house: "HOME",
  apartment: "APARTMENT",
  shop: "SHOP",
  office: "OFFICE",
  restaurant: "RESTAURANT",
  warehouse: "WAREHOUSE",
  other: "OTHER",
};

type Status = "idle" | "submitting" | "success" | "error";

type ConfiguratorSessionSummary = {
  sessionId: string;
  propertyType: string | null;
  siteSurveyRequired: boolean;
  estimate: { low: number; high: number } | null;
};

export default function RequestQuoteFormWithSuspense() {
  return (
    <Suspense fallback={null}>
      <RequestQuoteForm />
    </Suspense>
  );
}

function RequestQuoteForm() {
  const searchParams = useSearchParams();
  const configuratorSessionId = searchParams.get("configuratorSessionId");

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [session, setSession] = useState<ConfiguratorSessionSummary | null>(null);

  useEffect(() => {
    if (!configuratorSessionId) return;
    let cancelled = false;
    fetch(`/api/configurator/${configuratorSessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ConfiguratorSessionSummary | null) => {
        if (!cancelled && data) setSession(data);
      })
      .catch(() => {
        /* silently ignore — the form still works without the summary */
      });
    return () => {
      cancelled = true;
    };
  }, [configuratorSessionId]);

  const prefillPropertyType = session?.propertyType ? (CONFIGURATOR_PROPERTY_TYPE_MAP[session.propertyType] ?? "") : "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      propertyType: String(form.get("propertyType") || ""),
      location: String(form.get("location") || ""),
      notes: String(form.get("notes") || ""),
      website: String(form.get("website") || ""),
      ...(configuratorSessionId ? { configuratorSessionId } : {}),
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus("success");
        return;
      }

      const data = await res.json().catch(() => null);
      setErrorMessage(data?.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Container className="max-w-lg py-20 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Got it — thanks.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          We&rsquo;ll review your details and get back to you shortly. If it&rsquo;s urgent, message us on
          WhatsApp and we&rsquo;ll reply faster.
        </p>
        <a
          href="https://wa.me/923110597513"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
        >
          Chat on WhatsApp
        </a>
      </Container>
    );
  }

  return (
    <Container className="max-w-lg py-14 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Request a Quote</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Tell us about your property
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate">
        Fill this in and we&rsquo;ll get back to you with next steps — either an estimate or a site
        survey, depending on what your property needs.
      </p>

      {session && (
        <div className="mt-6 rounded-md border border-line bg-paper-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">From your Configurator result</p>
          {session.siteSurveyRequired || !session.estimate ? (
            <p className="mt-1.5 text-sm text-ink">We&rsquo;ll use your configuration details to prepare for a site survey.</p>
          ) : (
            <p className="mt-1.5 text-sm text-ink">
              Estimated {session.estimate.low.toLocaleString()}–{session.estimate.high.toLocaleString()} PKR — we&rsquo;ll confirm this as
              your final quotation.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/*
          Honeypot field — invisible to real visitors, left for bots that
          fill in every field they find. Off-screen absolute positioning,
          not display:none/visibility:hidden/type=hidden — some spam bots
          specifically skip fields hidden that way, but still fill in
          off-screen ones. tabIndex=-1 and aria-hidden keep it out of the
          way for keyboard/screen-reader users. See
          src/server/security/honeypot.ts for the server-side check.
        */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Field label="Full name" name="name" required autoComplete="name" />
        <Field label="Phone number" name="phone" type="tel" required autoComplete="tel" />
        <Field label="Email (optional)" name="email" type="email" autoComplete="email" />

        <div>
          <label htmlFor="propertyType" className="block text-sm font-medium text-ink">
            Property type
          </label>
          <select
            id="propertyType"
            name="propertyType"
            required
            defaultValue={prefillPropertyType}
            key={prefillPropertyType}
            className="mt-1.5 w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">Select property type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Field label="Location / area" name="location" required placeholder="e.g. F-10, Islamabad" />

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-ink">
            Anything else we should know? (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="mt-1.5 w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            placeholder="Number of cameras, specific areas to cover, existing equipment, etc."
          />
        </div>

        {status === "error" && errorMessage && (
          <p className="rounded-md border border-warn/30 bg-amber-50 px-3 py-2.5 text-sm text-warn">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : "Send request"}
        </button>
      </form>
    </Container>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
      />
    </div>
  );
}
