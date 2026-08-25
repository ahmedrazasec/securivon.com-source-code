"use client";

import { useEffect, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin/adminApi";
import { PageHeader, Button, Input, Select, Field, Table, EmptyRow, ErrorBanner, SuccessBanner, Modal, ConfirmDialog, Spinner, colors } from "@/components/admin/ui";

interface PricingTier {
  id: string;
  serviceType: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
}

interface CablingRate {
  id: string;
  cableType: string;
  ratePerMeter: number;
  includedAllowancePerCamera: number;
}

interface RoundingRule {
  id: string;
  granularity: number;
  direction: "NEAREST" | "UP" | "DOWN";
}

const COVERAGE_PREFIX = "CCTV_COVERAGE_";
const RECORDER_TYPE = "CCTV_RECORDER";

function tierLabel(serviceType: string) {
  if (serviceType === RECORDER_TYPE) return "Recorder tier";
  if (serviceType.startsWith(COVERAGE_PREFIX)) return `Coverage: ${serviceType.slice(COVERAGE_PREFIX.length)}`;
  return serviceType;
}

type TierFormState = { kind: "coverage" | "recorder"; tierName: string; minQuantity: string; maxQuantity: string; unitPrice: string };
const EMPTY_TIER_FORM: TierFormState = { kind: "coverage", tierName: "", minQuantity: "1", maxQuantity: "", unitPrice: "" };

export default function PricingPage() {
  const [tiers, setTiers] = useState<PricingTier[] | null>(null);
  const [cablingRate, setCablingRate] = useState<CablingRate | null>(null);
  const [roundingRule, setRoundingRule] = useState<RoundingRule | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showTierForm, setShowTierForm] = useState(false);
  const [tierForm, setTierForm] = useState<TierFormState>(EMPTY_TIER_FORM);
  const [tierFormError, setTierFormError] = useState<string | null>(null);
  const [savingTier, setSavingTier] = useState(false);
  const [deletingTier, setDeletingTier] = useState<PricingTier | null>(null);

  const [cablingForm, setCablingForm] = useState({ cableType: "", ratePerMeter: "", includedAllowancePerCamera: "" });
  const [savingCabling, setSavingCabling] = useState(false);
  const [cablingError, setCablingError] = useState<string | null>(null);

  const [roundingForm, setRoundingForm] = useState({ granularity: "500", direction: "NEAREST" });
  const [savingRounding, setSavingRounding] = useState(false);
  const [roundingError, setRoundingError] = useState<string | null>(null);

  async function loadAll() {
    setLoadError(null);
    try {
      const [tiersRes, cablingRes, roundingRes] = await Promise.all([
        adminFetch<{ tiers: PricingTier[] }>("/api/admin/pricing-tiers"),
        adminFetch<{ rate: CablingRate | null }>("/api/admin/cabling-rate"),
        adminFetch<{ rule: RoundingRule | null }>("/api/admin/rounding-rule"),
      ]);
      setTiers(tiersRes.tiers);
      setCablingRate(cablingRes.rate);
      if (cablingRes.rate) {
        setCablingForm({
          cableType: cablingRes.rate.cableType,
          ratePerMeter: String(cablingRes.rate.ratePerMeter),
          includedAllowancePerCamera: String(cablingRes.rate.includedAllowancePerCamera),
        });
      }
      setRoundingRule(roundingRes.rule);
      if (roundingRes.rule) {
        setRoundingForm({ granularity: String(roundingRes.rule.granularity), direction: roundingRes.rule.direction });
      }
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't load pricing configuration.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern, same precedent as ProductsPage
    loadAll();
  }, []);

  function flash(message: string) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  function openCreateTier() {
    setTierForm(EMPTY_TIER_FORM);
    setTierFormError(null);
    setShowTierForm(true);
  }

  async function handleSaveTier() {
    setSavingTier(true);
    setTierFormError(null);
    const serviceType = tierForm.kind === "recorder" ? RECORDER_TYPE : `${COVERAGE_PREFIX}${tierForm.tierName.trim().toUpperCase()}`;
    const payload = {
      serviceType,
      minQuantity: Number(tierForm.minQuantity) || 0,
      maxQuantity: tierForm.maxQuantity.trim() === "" ? null : Number(tierForm.maxQuantity),
      unitPrice: Number(tierForm.unitPrice) || 0,
    };
    try {
      await adminFetch("/api/admin/pricing-tiers", { method: "POST", body: JSON.stringify(payload) });
      flash("Pricing tier created.");
      setShowTierForm(false);
      await loadAll();
    } catch (err) {
      setTierFormError(err instanceof AdminApiError ? err.message : "Something went wrong.");
    } finally {
      setSavingTier(false);
    }
  }

  async function handleDeleteTier() {
    if (!deletingTier) return;
    try {
      await adminFetch(`/api/admin/pricing-tiers/${deletingTier.id}`, { method: "DELETE" });
      flash("Pricing tier deleted.");
      setDeletingTier(null);
      await loadAll();
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't delete pricing tier.");
      setDeletingTier(null);
    }
  }

  async function handleSaveCabling() {
    setSavingCabling(true);
    setCablingError(null);
    const payload = {
      cableType: cablingForm.cableType.trim(),
      ratePerMeter: Number(cablingForm.ratePerMeter) || 0,
      includedAllowancePerCamera: Number(cablingForm.includedAllowancePerCamera) || 0,
    };
    try {
      await adminFetch("/api/admin/cabling-rate", { method: "PATCH", body: JSON.stringify(payload) });
      flash("Cabling rate saved.");
      await loadAll();
    } catch (err) {
      setCablingError(err instanceof AdminApiError ? err.message : "Something went wrong.");
    } finally {
      setSavingCabling(false);
    }
  }

  async function handleSaveRounding() {
    setSavingRounding(true);
    setRoundingError(null);
    const payload = { granularity: Number(roundingForm.granularity) || 500, direction: roundingForm.direction };
    try {
      await adminFetch("/api/admin/rounding-rule", { method: "PATCH", body: JSON.stringify(payload) });
      flash("Rounding rule saved.");
      await loadAll();
    } catch (err) {
      setRoundingError(err instanceof AdminApiError ? err.message : "Something went wrong.");
    } finally {
      setSavingRounding(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pricing"
        description="This configuration directly drives the public Configurator's price estimate — without it, every configuration routes to a site survey instead of a price."
      />

      {successMessage && <SuccessBanner>{successMessage}</SuccessBanner>}
      {loadError && <ErrorBanner>{loadError}</ErrorBanner>}

      <section style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.ink }}>Coverage &amp; Recorder Tiers</h2>
          <Button onClick={openCreateTier}>+ New Tier</Button>
        </div>
        {tiers === null ? (
          <Spinner />
        ) : (
          <Table columns={["Tier", "Min Qty", "Max Qty", "Unit Price", ""]}>
            {tiers.length === 0 ? (
              <EmptyRow colSpan={5}>No pricing tiers yet — the Configurator cannot produce a priced estimate until at least one coverage tier and one recorder tier exist.</EmptyRow>
            ) : (
              tiers.map((t) => (
                <tr key={t.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{tierLabel(t.serviceType)}</td>
                  <td style={{ padding: "10px 14px", color: colors.slate }}>{t.minQuantity}</td>
                  <td style={{ padding: "10px 14px", color: colors.slate }}>{t.maxQuantity ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: colors.slate }}>{t.unitPrice.toLocaleString()} PKR</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <button onClick={() => setDeletingTier(t)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        )}
      </section>

      <section style={{ marginBottom: 36, maxWidth: 420 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.ink, marginBottom: 12 }}>Cabling Rate</h2>
        {cablingError && <ErrorBanner>{cablingError}</ErrorBanner>}
        <Field label="Cable type">
          <Input value={cablingForm.cableType} onChange={(v) => setCablingForm({ ...cablingForm, cableType: v })} placeholder="e.g. CAT6" />
        </Field>
        <Field label="Rate per meter (PKR)">
          <Input type="number" value={cablingForm.ratePerMeter} onChange={(v) => setCablingForm({ ...cablingForm, ratePerMeter: v })} />
        </Field>
        <Field label="Included allowance per camera (meters)">
          <Input
            type="number"
            value={cablingForm.includedAllowancePerCamera}
            onChange={(v) => setCablingForm({ ...cablingForm, includedAllowancePerCamera: v })}
          />
        </Field>
        <Button onClick={handleSaveCabling} disabled={savingCabling}>
          {savingCabling ? "Saving…" : cablingRate ? "Save changes" : "Create cabling rate"}
        </Button>
      </section>

      <section style={{ maxWidth: 420 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.ink, marginBottom: 12 }}>Rounding Rule</h2>
        {roundingError && <ErrorBanner>{roundingError}</ErrorBanner>}
        <Field label="Granularity (PKR)">
          <Input type="number" value={roundingForm.granularity} onChange={(v) => setRoundingForm({ ...roundingForm, granularity: v })} />
        </Field>
        <Field label="Direction">
          <Select
            value={roundingForm.direction}
            onChange={(v) => setRoundingForm({ ...roundingForm, direction: v })}
            options={[
              { value: "NEAREST", label: "Nearest" },
              { value: "UP", label: "Up" },
              { value: "DOWN", label: "Down" },
            ]}
          />
        </Field>
        <Button onClick={handleSaveRounding} disabled={savingRounding}>
          {savingRounding ? "Saving…" : roundingRule ? "Save changes" : "Create rounding rule"}
        </Button>
      </section>

      {showTierForm && (
        <Modal title="New Pricing Tier" onClose={() => setShowTierForm(false)}>
          {tierFormError && <ErrorBanner>{tierFormError}</ErrorBanner>}
          <Field label="Tier type">
            <Select
              value={tierForm.kind}
              onChange={(v) => setTierForm({ ...tierForm, kind: v as "coverage" | "recorder" })}
              options={[
                { value: "coverage", label: "Coverage tier (e.g. Standard, Wide, High)" },
                { value: "recorder", label: "Recorder tier" },
              ]}
            />
          </Field>
          {tierForm.kind === "coverage" && (
            <Field label="Tier name">
              <Input value={tierForm.tierName} onChange={(v) => setTierForm({ ...tierForm, tierName: v })} placeholder="e.g. STANDARD, WIDE, HIGH" />
            </Field>
          )}
          {tierForm.kind === "recorder" && (
            <p style={{ fontSize: 12, color: colors.slate, marginBottom: 14 }}>
              Only one recorder tier is expected per capacity bracket — Min/Max Qty below defines the camera-count range this recorder covers.
            </p>
          )}
          <Field label="Min quantity">
            <Input type="number" value={tierForm.minQuantity} onChange={(v) => setTierForm({ ...tierForm, minQuantity: v })} />
          </Field>
          <Field label="Max quantity (leave blank for no limit)">
            <Input type="number" value={tierForm.maxQuantity} onChange={(v) => setTierForm({ ...tierForm, maxQuantity: v })} />
          </Field>
          <Field label={tierForm.kind === "coverage" ? "Rate per camera (PKR)" : "Price (PKR)"}>
            <Input type="number" value={tierForm.unitPrice} onChange={(v) => setTierForm({ ...tierForm, unitPrice: v })} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setShowTierForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTier} disabled={savingTier || (tierForm.kind === "coverage" && !tierForm.tierName.trim())}>
              {savingTier ? "Saving…" : "Create tier"}
            </Button>
          </div>
        </Modal>
      )}

      {deletingTier && (
        <ConfirmDialog
          title="Delete pricing tier?"
          message={`This will remove "${tierLabel(deletingTier.serviceType)}" from the Configurator's pricing calculation.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteTier}
          onCancel={() => setDeletingTier(null)}
        />
      )}
    </div>
  );
}
