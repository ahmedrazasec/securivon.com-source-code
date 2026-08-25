"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/marketing/Primitives";

type PropertyType = "house" | "apartment" | "shop" | "office" | "restaurant" | "warehouse" | "other";
type CoverageTier = "standard" | "wide" | "high";
type StorageTier = "2w" | "4w" | "1m";
type CableDistance = "short" | "medium" | "long";

interface Answers {
  propertyType: PropertyType | null;
  cameraCount: number;
  coverageTierId: CoverageTier;
  floors: number;
  cableDistanceCategory: CableDistance;
  difficultAccess: boolean;
  needsConduitTrunking: boolean;
  isNewCabling: boolean;
  storageTierId: StorageTier;
  wantsRemoteViewSetup: boolean;
  optionalServiceIds: ("fire" | "intrusion")[];
}

const DEFAULT_ANSWERS: Answers = {
  propertyType: null,
  cameraCount: 4,
  coverageTierId: "standard",
  floors: 1,
  cableDistanceCategory: "short",
  difficultAccess: false,
  needsConduitTrunking: false,
  isNewCabling: true,
  storageTierId: "2w",
  wantsRemoteViewSetup: true,
  optionalServiceIds: [],
};

const PROPERTY_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: "house", label: "Home" },
  { value: "apartment", label: "Apartment" },
  { value: "shop", label: "Shop" },
  { value: "restaurant", label: "Restaurant" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse / Industrial" },
  { value: "other", label: "Other" },
];

type EstimateResult = {
  priceType: string;
  low: number | null;
  high: number | null;
  insufficientData: boolean;
} | null;

type ConfiguratorResponse = {
  sessionId: string;
  siteSurveyRequired: boolean;
  reasons: string[];
  estimate: EstimateResult;
};

const TOTAL_STEPS = 5;

export default function ConfiguratorPage() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>(DEFAULT_ANSWERS);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ConfiguratorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleOptionalService(id: "fire" | "intrusion") {
    setAnswers((prev) => ({
      ...prev,
      optionalServiceIds: prev.optionalServiceIds.includes(id)
        ? prev.optionalServiceIds.filter((s) => s !== id)
        : [...prev.optionalServiceIds, id],
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/configurator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      const data: ConfiguratorResponse = await res.json();
      setResult(data);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return <QuoteResult result={result} />;
  }

  return (
    <Container className="max-w-xl py-14 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Configurator</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Tell us what you need
      </h1>
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>

      <div className="mt-10">
        {step === 1 && (
          <Step title="What kind of property is this?">
            <div className="grid grid-cols-2 gap-3">
              {PROPERTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("propertyType", opt.value)}
                  className={`rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    answers.propertyType === opt.value
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-line bg-paper-raised text-ink hover:border-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step title="How many cameras do you think you need?">
            <NumberField value={answers.cameraCount} onChange={(v) => update("cameraCount", v)} min={1} max={64} />
            <p className="mt-3 text-xs text-slate">Not sure? A rough guess is fine — we&rsquo;ll confirm exact placement later.</p>

            <fieldset className="mt-8">
              <legend className="text-sm font-medium text-ink">What matters most for coverage?</legend>
              <div className="mt-3 space-y-2">
                {[
                  { value: "standard" as const, label: "Standard coverage", hint: "Good general-purpose viewing area." },
                  { value: "wide" as const, label: "Wide-angle coverage", hint: "See more of a large area per camera." },
                  { value: "high" as const, label: "High detail", hint: "Clearer close-up detail, e.g. faces or license plates." },
                ].map((opt) => (
                  <RadioRow
                    key={opt.value}
                    selected={answers.coverageTierId === opt.value}
                    onSelect={() => update("coverageTierId", opt.value)}
                    label={opt.label}
                    hint={opt.hint}
                  />
                ))}
              </div>
            </fieldset>
          </Step>
        )}

        {step === 3 && (
          <Step title="A bit about the property">
            <label className="block text-sm font-medium text-ink">How many floors?</label>
            <NumberField value={answers.floors} onChange={(v) => update("floors", v)} min={1} max={20} />

            <fieldset className="mt-8">
              <legend className="text-sm font-medium text-ink">How far do cameras need to run cable?</legend>
              <div className="mt-3 space-y-2">
                {[
                  { value: "short" as const, label: "Short distances", hint: "Cameras close to the recorder/router." },
                  { value: "medium" as const, label: "Medium distances", hint: "A mix of near and far cameras." },
                  { value: "long" as const, label: "Long distances", hint: "Cameras spread across a large property." },
                ].map((opt) => (
                  <RadioRow
                    key={opt.value}
                    selected={answers.cableDistanceCategory === opt.value}
                    onSelect={() => update("cableDistanceCategory", opt.value)}
                    label={opt.label}
                    hint={opt.hint}
                  />
                ))}
              </div>
            </fieldset>

            <details className="mt-6 rounded-md border border-line bg-paper-raised p-4">
              <summary className="cursor-pointer text-sm font-medium text-ink">More technical details (optional)</summary>
              <div className="mt-4 space-y-3">
                <CheckboxRow
                  checked={answers.difficultAccess}
                  onChange={(v) => update("difficultAccess", v)}
                  label="Difficult height or access (e.g. high ceilings, tricky roof access)"
                />
                <CheckboxRow
                  checked={answers.needsConduitTrunking}
                  onChange={(v) => update("needsConduitTrunking", v)}
                  label="Cables need to run through conduit/trunking"
                />
                <CheckboxRow
                  checked={answers.isNewCabling}
                  onChange={(v) => update("isNewCabling", v)}
                  label="This needs new cabling (not reusing existing wiring)"
                />
              </div>
            </details>
          </Step>
        )}

        {step === 4 && (
          <Step title="How long should recordings be kept?">
            <div className="space-y-2">
              {[
                { value: "2w" as const, label: "2 weeks" },
                { value: "4w" as const, label: "4 weeks" },
                { value: "1m" as const, label: "1 month" },
              ].map((opt) => (
                <RadioRow
                  key={opt.value}
                  selected={answers.storageTierId === opt.value}
                  onSelect={() => update("storageTierId", opt.value)}
                  label={opt.label}
                />
              ))}
            </div>

            <div className="mt-6">
              <CheckboxRow
                checked={answers.wantsRemoteViewSetup}
                onChange={(v) => update("wantsRemoteViewSetup", v)}
                label="Set up remote viewing on my phone"
              />
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step title="Anything else you need?">
            <div className="space-y-2">
              <CheckboxRow
                checked={answers.optionalServiceIds.includes("fire")}
                onChange={() => toggleOptionalService("fire")}
                label="Fire alarm system"
              />
              <CheckboxRow
                checked={answers.optionalServiceIds.includes("intrusion")}
                onChange={() => toggleOptionalService("intrusion")}
                label="Intrusion / alarm system"
              />
            </div>
            <p className="mt-3 text-xs text-slate">
              Fire alarm and intrusion systems always go through a site survey before a final quotation, given how
              important it is to get coverage right.
            </p>
          </Step>
        )}

        {error && <p className="mt-6 rounded-md border border-warn/30 bg-amber-50 px-3 py-2.5 text-sm text-warn">{error}</p>}

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="text-sm font-medium text-slate disabled:opacity-0"
          >
            ← Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !answers.propertyType}
              className="rounded-md bg-ink px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-ink px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong disabled:opacity-60"
            >
              {submitting ? "Calculating…" : "Get my estimate"}
            </button>
          )}
        </div>
      </div>
    </Container>
  );
}

function QuoteResult({ result }: { result: ConfiguratorResponse }) {
  if (result.siteSurveyRequired || !result.estimate || result.estimate.insufficientData) {
    return (
      <Container className="max-w-lg py-14 text-center sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Your result</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Site survey recommended
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate">
          Based on what you told us, we&rsquo;d like to take a closer look before giving you a final quotation —
          this makes sure we get coverage right for your property.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/request-quote?configuratorSessionId=${result.sessionId}`}
            className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
          >
            Book a Site Survey
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
      </Container>
    );
  }

  const { estimate } = result;
  return (
    <Container className="max-w-lg py-14 text-center sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Your result</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {estimate?.low?.toLocaleString()} – {estimate?.high?.toLocaleString()} PKR
      </h1>
      <p className="mt-3 text-sm font-medium text-warn">Estimated price — final quotation confirmed after site survey.</p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/request-quote?configuratorSessionId=${result.sessionId}`}
          className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-accent-strong"
        >
          Request Final Quote
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
    </Container>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function RadioRow({
  selected,
  onSelect,
  label,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
        selected ? "border-accent bg-accent-soft" : "border-line bg-paper-raised hover:border-accent"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-accent-strong" : "border-line"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-accent-strong" />}
      </span>
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-slate">{hint}</span>}
      </span>
    </button>
  );
}

function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-line accent-accent" />
      {label}
    </label>
  );
}

function NumberField({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-lg text-ink"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className="w-20 rounded-md border border-line bg-paper-raised px-3 py-2.5 text-center text-sm text-ink"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-lg text-ink"
      >
        +
      </button>
    </div>
  );
}
