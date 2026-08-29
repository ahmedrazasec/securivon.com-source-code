"use client";

import { useEffect, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin/adminApi";
import { PageHeader, Button, Input, Select, Field, Table, EmptyRow, ErrorBanner, SuccessBanner, Modal, ConfirmDialog, Spinner, Badge, colors } from "@/components/admin/ui";

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

interface Discount {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  appliesToPackageId: string | null;
  appliesToCategoryId: string | null;
  sitewide: boolean;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
}

interface TaxRule {
  id: string;
  name: string;
  ratePercentage: number;
  appliesTo: "HARDWARE" | "INSTALLATION" | "ALL";
  inclusiveOrExclusive: "INCLUSIVE" | "EXCLUSIVE" | "UNSTATED";
  active: boolean;
}

interface MinimumChargeRule {
  id: string;
  serviceType: string;
  minimumChargeAmount: number;
}

const MIN_CHARGE_SERVICE_TYPES = ["CCTV", "ACCESS_CONTROL", "INTERCOM", "NETWORKING"] as const;
const MIN_CHARGE_SERVICE_LABELS: Record<string, string> = {
  CCTV: "CCTV",
  ACCESS_CONTROL: "Access Control",
  INTERCOM: "Video Intercom",
  NETWORKING: "Networking & Cabling",
};

// Only "CCTV" is currently read by the Configurator's rate-set loader —
// see MinimumChargeRuleRepository's doc comment in repositories/types.ts.
const MIN_CHARGE_ACTIVE_SERVICE_TYPE = "CCTV";

const COVERAGE_PREFIX = "CCTV_COVERAGE_";
const RECORDER_TYPE = "CCTV_RECORDER";

function tierLabel(serviceType: string) {
  if (serviceType === RECORDER_TYPE) return "Recorder tier";
  if (serviceType.startsWith(COVERAGE_PREFIX)) return `Coverage: ${serviceType.slice(COVERAGE_PREFIX.length)}`;
  return serviceType;
}

type TierFormState = { kind: "coverage" | "recorder"; tierName: string; minQuantity: string; maxQuantity: string; unitPrice: string };
const EMPTY_TIER_FORM: TierFormState = { kind: "coverage", tierName: "", minQuantity: "1", maxQuantity: "", unitPrice: "" };

function emptyDiscountForm() {
  return {
    name: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    value: "",
    appliesToPackageId: "",
    appliesToCategoryId: "",
    sitewide: true,
    validFrom: "",
    validUntil: "",
    active: false,
  };
}
function discountToForm(d: Discount): ReturnType<typeof emptyDiscountForm> {
  return {
    name: d.name,
    type: d.type,
    value: String(d.value),
    appliesToPackageId: d.appliesToPackageId ?? "",
    appliesToCategoryId: d.appliesToCategoryId ?? "",
    sitewide: d.sitewide,
    validFrom: d.validFrom ? d.validFrom.slice(0, 16) : "",
    validUntil: d.validUntil ? d.validUntil.slice(0, 16) : "",
    active: d.active,
  };
}

function emptyTaxForm() {
  return {
    name: "",
    ratePercentage: "",
    appliesTo: "ALL" as "HARDWARE" | "INSTALLATION" | "ALL",
    inclusiveOrExclusive: "UNSTATED" as "INCLUSIVE" | "EXCLUSIVE" | "UNSTATED",
    active: false,
  };
}
function taxToForm(t: TaxRule): ReturnType<typeof emptyTaxForm> {
  return {
    name: t.name,
    ratePercentage: String(t.ratePercentage),
    appliesTo: t.appliesTo,
    inclusiveOrExclusive: t.inclusiveOrExclusive,
    active: t.active,
  };
}

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

  // ---- Discounts ----
  const [discounts, setDiscounts] = useState<Discount[] | null>(null);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [discountForm, setDiscountForm] = useState(emptyDiscountForm());
  const [discountFormError, setDiscountFormError] = useState<string | null>(null);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [deletingDiscount, setDeletingDiscount] = useState<Discount | null>(null);

  // ---- Tax Rules ----
  const [taxRules, setTaxRules] = useState<TaxRule[] | null>(null);
  const [showTaxForm, setShowTaxForm] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxRule | null>(null);
  const [taxForm, setTaxForm] = useState(emptyTaxForm());
  const [taxFormError, setTaxFormError] = useState<string | null>(null);
  const [savingTax, setSavingTax] = useState(false);
  const [deletingTax, setDeletingTax] = useState<TaxRule | null>(null);

  // ---- Minimum Charge Rules ----
  const [minCharges, setMinCharges] = useState<MinimumChargeRule[] | null>(null);
  const [editingMinChargeType, setEditingMinChargeType] = useState<(typeof MIN_CHARGE_SERVICE_TYPES)[number] | null>(null);
  const [minChargeForm, setMinChargeForm] = useState("0");
  const [savingMinCharge, setSavingMinCharge] = useState(false);
  const [minChargeError, setMinChargeError] = useState<string | null>(null);

  async function loadAll() {
    setLoadError(null);
    try {
      const [tiersRes, cablingRes, roundingRes, discountsRes, taxRulesRes, minChargesRes] = await Promise.all([
        adminFetch<{ tiers: PricingTier[] }>("/api/admin/pricing-tiers"),
        adminFetch<{ rate: CablingRate | null }>("/api/admin/cabling-rate"),
        adminFetch<{ rule: RoundingRule | null }>("/api/admin/rounding-rule"),
        adminFetch<{ discounts: Discount[] }>("/api/admin/discounts"),
        adminFetch<{ taxRules: TaxRule[] }>("/api/admin/tax-rules"),
        adminFetch<{ rules: MinimumChargeRule[] }>("/api/admin/minimum-charge-rules"),
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
      setDiscounts(discountsRes.discounts);
      setTaxRules(taxRulesRes.taxRules);
      setMinCharges(minChargesRes.rules);
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

  // ---- Discounts ----

  function openCreateDiscount() {
    setEditingDiscount(null);
    setDiscountForm(emptyDiscountForm());
    setDiscountFormError(null);
    setShowDiscountForm(true);
  }
  function openEditDiscount(d: Discount) {
    setEditingDiscount(d);
    setDiscountForm(discountToForm(d));
    setDiscountFormError(null);
    setShowDiscountForm(true);
  }

  async function handleSaveDiscount() {
    setSavingDiscount(true);
    setDiscountFormError(null);
    const payload = {
      name: discountForm.name.trim(),
      type: discountForm.type,
      value: Number(discountForm.value) || 0,
      appliesToPackageId: discountForm.appliesToPackageId.trim() || null,
      appliesToCategoryId: discountForm.appliesToCategoryId.trim() || null,
      sitewide: discountForm.sitewide,
      validFrom: discountForm.validFrom ? new Date(discountForm.validFrom).toISOString() : null,
      validUntil: discountForm.validUntil ? new Date(discountForm.validUntil).toISOString() : null,
      active: discountForm.active,
    };
    try {
      if (editingDiscount) {
        await adminFetch(`/api/admin/discounts/${editingDiscount.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        flash("Discount updated.");
      } else {
        await adminFetch("/api/admin/discounts", { method: "POST", body: JSON.stringify(payload) });
        flash("Discount created.");
      }
      setShowDiscountForm(false);
      await loadAll();
    } catch (err) {
      setDiscountFormError(err instanceof AdminApiError ? err.message : "Something went wrong.");
    } finally {
      setSavingDiscount(false);
    }
  }

  async function handleDeleteDiscount() {
    if (!deletingDiscount) return;
    try {
      await adminFetch(`/api/admin/discounts/${deletingDiscount.id}`, { method: "DELETE" });
      flash("Discount deleted.");
      setDeletingDiscount(null);
      await loadAll();
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't delete discount.");
      setDeletingDiscount(null);
    }
  }

  // ---- Tax Rules ----

  function openCreateTax() {
    setEditingTax(null);
    setTaxForm(emptyTaxForm());
    setTaxFormError(null);
    setShowTaxForm(true);
  }
  function openEditTax(t: TaxRule) {
    setEditingTax(t);
    setTaxForm(taxToForm(t));
    setTaxFormError(null);
    setShowTaxForm(true);
  }

  async function handleSaveTax() {
    setSavingTax(true);
    setTaxFormError(null);
    const payload = {
      name: taxForm.name.trim(),
      ratePercentage: Number(taxForm.ratePercentage) || 0,
      appliesTo: taxForm.appliesTo,
      inclusiveOrExclusive: taxForm.inclusiveOrExclusive,
      active: taxForm.active,
    };
    try {
      if (editingTax) {
        await adminFetch(`/api/admin/tax-rules/${editingTax.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        flash("Tax rule updated.");
      } else {
        await adminFetch("/api/admin/tax-rules", { method: "POST", body: JSON.stringify(payload) });
        flash("Tax rule created.");
      }
      setShowTaxForm(false);
      await loadAll();
    } catch (err) {
      setTaxFormError(err instanceof AdminApiError ? err.message : "Something went wrong.");
    } finally {
      setSavingTax(false);
    }
  }

  async function handleDeleteTax() {
    if (!deletingTax) return;
    try {
      await adminFetch(`/api/admin/tax-rules/${deletingTax.id}`, { method: "DELETE" });
      flash("Tax rule deleted.");
      setDeletingTax(null);
      await loadAll();
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't delete tax rule.");
      setDeletingTax(null);
    }
  }

  // ---- Minimum Charge Rules ----

  function openEditMinCharge(serviceType: (typeof MIN_CHARGE_SERVICE_TYPES)[number]) {
    const existing = (minCharges ?? []).find((r) => r.serviceType === serviceType);
    setMinChargeForm(String(existing?.minimumChargeAmount ?? 0));
    setMinChargeError(null);
    setEditingMinChargeType(serviceType);
  }

  async function handleSaveMinCharge() {
    if (!editingMinChargeType) return;
    setSavingMinCharge(true);
    setMinChargeError(null);
    try {
      await adminFetch(`/api/admin/minimum-charge-rules/${editingMinChargeType}`, {
        method: "PATCH",
        body: JSON.stringify({ minimumChargeAmount: Number(minChargeForm) || 0 }),
      });
      flash(`${MIN_CHARGE_SERVICE_LABELS[editingMinChargeType]} minimum charge saved.`);
      setEditingMinChargeType(null);
      await loadAll();
    } catch (err) {
      setMinChargeError(err instanceof AdminApiError ? err.message : "Something went wrong.");
    } finally {
      setSavingMinCharge(false);
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

      <section style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.ink }}>Discounts</h2>
            <p style={{ fontSize: 12, color: colors.slateLight, maxWidth: 560, marginTop: 2 }}>
              The Configurator currently applies at most one discount at a time — the single most recently updated row
              that is both <strong>sitewide</strong> and <strong>active</strong>. Package/category-scoped discounts are
              recorded here but not yet combined into the estimate automatically.
            </p>
          </div>
          <Button onClick={openCreateDiscount}>+ New Discount</Button>
        </div>
        {discounts === null ? (
          <Spinner />
        ) : (
          <Table columns={["Name", "Type", "Value", "Sitewide", "Active", "Valid window", ""]}>
            {discounts.length === 0 ? (
              <EmptyRow colSpan={7}>No discounts configured — the Configurator applies no discount by default.</EmptyRow>
            ) : (
              discounts.map((d) => (
                <tr key={d.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{d.name}</td>
                  <td style={{ padding: "10px 14px", color: colors.slate }}>{d.type === "PERCENTAGE" ? "Percentage" : "Fixed amount"}</td>
                  <td style={{ padding: "10px 14px", color: colors.slate }}>
                    {d.type === "PERCENTAGE" ? `${d.value}%` : `${d.value.toLocaleString()} PKR`}
                  </td>
                  <td style={{ padding: "10px 14px", color: colors.slate }}>{d.sitewide ? "Yes" : "No"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge value={d.active ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td style={{ padding: "10px 14px", color: colors.slate, fontSize: 12 }}>
                    {d.validFrom || d.validUntil
                      ? `${d.validFrom ? new Date(d.validFrom).toLocaleDateString() : "…"} – ${d.validUntil ? new Date(d.validUntil).toLocaleDateString() : "…"}`
                      : "Always"}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => openEditDiscount(d)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, marginRight: 12 }}>
                      Edit
                    </button>
                    <button onClick={() => setDeletingDiscount(d)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        )}
      </section>

      <section style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.ink }}>Tax Rules</h2>
            <p style={{ fontSize: 12, color: colors.slateLight, maxWidth: 560, marginTop: 2 }}>
              The Configurator currently applies at most one tax rule at a time — the single most recently updated row
              that is <strong>active</strong>. Defaults to 0% / inactive until a real, confirmed tax treatment is entered.
            </p>
          </div>
          <Button onClick={openCreateTax}>+ New Tax Rule</Button>
        </div>
        {taxRules === null ? (
          <Spinner />
        ) : (
          <Table columns={["Name", "Rate", "Applies to", "Inclusive/Exclusive", "Active", ""]}>
            {taxRules.length === 0 ? (
              <EmptyRow colSpan={6}>No tax rules configured — the Configurator applies no tax by default.</EmptyRow>
            ) : (
              taxRules.map((t) => (
                <tr key={t.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{t.name}</td>
                  <td style={{ padding: "10px 14px", color: colors.slate }}>{t.ratePercentage}%</td>
                  <td style={{ padding: "10px 14px", color: colors.slate }}>{t.appliesTo}</td>
                  <td style={{ padding: "10px 14px", color: colors.slate }}>{t.inclusiveOrExclusive}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge value={t.active ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => openEditTax(t)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, marginRight: 12 }}>
                      Edit
                    </button>
                    <button onClick={() => setDeletingTax(t)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        )}
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.ink, marginBottom: 4 }}>Minimum Charge Rules</h2>
        <p style={{ fontSize: 12, color: colors.slateLight, maxWidth: 560, marginBottom: 12 }}>
          Only <strong>{MIN_CHARGE_SERVICE_LABELS[MIN_CHARGE_ACTIVE_SERVICE_TYPE]}</strong> is currently read by the
          Configurator — the other service types are recorded here for consistency with Installation Rates but not
          yet consumed by an estimate flow.
        </p>
        {minCharges === null ? (
          <Spinner />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {MIN_CHARGE_SERVICE_TYPES.map((type) => {
              const rule = minCharges.find((r) => r.serviceType === type);
              return (
                <div key={type} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, background: "#fff" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>{MIN_CHARGE_SERVICE_LABELS[type]}</div>
                  {rule ? (
                    <div style={{ fontSize: 12, color: colors.slate, marginBottom: 10 }}>{rule.minimumChargeAmount.toLocaleString()} PKR minimum</div>
                  ) : (
                    <div style={{ fontSize: 12, color: colors.slateLight, marginBottom: 10 }}>Not configured — no minimum enforced beyond the installation-rate floor.</div>
                  )}
                  <button
                    onClick={() => openEditMinCharge(type)}
                    style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, padding: 0 }}
                  >
                    {rule ? "Edit" : "Configure"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
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

      {showDiscountForm && (
        <Modal title={editingDiscount ? "Edit Discount" : "New Discount"} onClose={() => setShowDiscountForm(false)} wide>
          {discountFormError && <ErrorBanner>{discountFormError}</ErrorBanner>}
          <Field label="Name">
            <Input value={discountForm.name} onChange={(v) => setDiscountForm({ ...discountForm, name: v })} placeholder="e.g. Eid Promo 2026" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Type">
              <Select
                value={discountForm.type}
                onChange={(v) => setDiscountForm({ ...discountForm, type: v as "PERCENTAGE" | "FIXED_AMOUNT" })}
                options={[
                  { value: "PERCENTAGE", label: "Percentage" },
                  { value: "FIXED_AMOUNT", label: "Fixed amount (PKR)" },
                ]}
              />
            </Field>
            <Field label={discountForm.type === "PERCENTAGE" ? "Value (%)" : "Value (PKR)"}>
              <Input type="number" value={discountForm.value} onChange={(v) => setDiscountForm({ ...discountForm, value: v })} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: colors.ink, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={discountForm.sitewide}
                onChange={(e) => setDiscountForm({ ...discountForm, sitewide: e.target.checked })}
              />
              Sitewide
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: colors.ink, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={discountForm.active}
                onChange={(e) => setDiscountForm({ ...discountForm, active: e.target.checked })}
              />
              Active
            </label>
          </div>
          {!discountForm.sitewide && (
            <p style={{ fontSize: 12, color: colors.warn, background: colors.warnBg, border: `1px solid ${colors.warnBorder}`, borderRadius: 6, padding: "8px 10px", marginBottom: 14 }}>
              Not sitewide — the Configurator&apos;s estimate will not apply this discount yet (only sitewide + active
              discounts are currently read by the pricing engine). Recorded for reference only.
            </p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Applies to package ID (optional)">
              <Input
                value={discountForm.appliesToPackageId}
                onChange={(v) => setDiscountForm({ ...discountForm, appliesToPackageId: v })}
                placeholder="Package ID"
              />
            </Field>
            <Field label="Applies to category ID (optional)">
              <Input
                value={discountForm.appliesToCategoryId}
                onChange={(v) => setDiscountForm({ ...discountForm, appliesToCategoryId: v })}
                placeholder="Category ID"
              />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Valid from (optional)">
              <Input type="datetime-local" value={discountForm.validFrom} onChange={(v) => setDiscountForm({ ...discountForm, validFrom: v })} />
            </Field>
            <Field label="Valid until (optional)">
              <Input type="datetime-local" value={discountForm.validUntil} onChange={(v) => setDiscountForm({ ...discountForm, validUntil: v })} />
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setShowDiscountForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDiscount} disabled={savingDiscount || !discountForm.name.trim()}>
              {savingDiscount ? "Saving…" : editingDiscount ? "Save changes" : "Create discount"}
            </Button>
          </div>
        </Modal>
      )}

      {deletingDiscount && (
        <ConfirmDialog
          title="Delete discount?"
          message={`This will remove "${deletingDiscount.name}" from Admin — if it is currently the active sitewide discount, the Configurator will stop applying any discount.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteDiscount}
          onCancel={() => setDeletingDiscount(null)}
        />
      )}

      {showTaxForm && (
        <Modal title={editingTax ? "Edit Tax Rule" : "New Tax Rule"} onClose={() => setShowTaxForm(false)}>
          {taxFormError && <ErrorBanner>{taxFormError}</ErrorBanner>}
          <Field label="Name">
            <Input value={taxForm.name} onChange={(v) => setTaxForm({ ...taxForm, name: v })} placeholder="e.g. General Sales Tax" />
          </Field>
          <Field label="Rate (%)">
            <Input type="number" value={taxForm.ratePercentage} onChange={(v) => setTaxForm({ ...taxForm, ratePercentage: v })} />
          </Field>
          <Field label="Applies to">
            <Select
              value={taxForm.appliesTo}
              onChange={(v) => setTaxForm({ ...taxForm, appliesTo: v as TaxRule["appliesTo"] })}
              options={[
                { value: "ALL", label: "Everything" },
                { value: "HARDWARE", label: "Hardware only" },
                { value: "INSTALLATION", label: "Installation only" },
              ]}
            />
          </Field>
          <Field label="Inclusive / exclusive">
            <Select
              value={taxForm.inclusiveOrExclusive}
              onChange={(v) => setTaxForm({ ...taxForm, inclusiveOrExclusive: v as TaxRule["inclusiveOrExclusive"] })}
              options={[
                { value: "UNSTATED", label: "Unstated" },
                { value: "INCLUSIVE", label: "Inclusive" },
                { value: "EXCLUSIVE", label: "Exclusive" },
              ]}
            />
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: colors.ink, cursor: "pointer", marginBottom: 14 }}>
            <input type="checkbox" checked={taxForm.active} onChange={(e) => setTaxForm({ ...taxForm, active: e.target.checked })} />
            Active
          </label>
          {taxForm.active && Number(taxForm.ratePercentage) > 0 && (
            <p style={{ fontSize: 12, color: colors.warn, background: colors.warnBg, border: `1px solid ${colors.warnBorder}`, borderRadius: 6, padding: "8px 10px", marginBottom: 14 }}>
              Marking this active applies {taxForm.ratePercentage}% tax to every Configurator estimate immediately —
              only one active tax rule is read at a time (the most recently updated one).
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setShowTaxForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTax} disabled={savingTax || !taxForm.name.trim()}>
              {savingTax ? "Saving…" : editingTax ? "Save changes" : "Create tax rule"}
            </Button>
          </div>
        </Modal>
      )}

      {deletingTax && (
        <ConfirmDialog
          title="Delete tax rule?"
          message={`This will remove "${deletingTax.name}" from Admin — if it is currently the active tax rule, the Configurator will stop applying any tax.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteTax}
          onCancel={() => setDeletingTax(null)}
        />
      )}

      {editingMinChargeType && (
        <Modal title={`${MIN_CHARGE_SERVICE_LABELS[editingMinChargeType]} Minimum Charge`} onClose={() => setEditingMinChargeType(null)}>
          {minChargeError && <ErrorBanner>{minChargeError}</ErrorBanner>}
          <Field label="Minimum charge (PKR)">
            <Input type="number" value={minChargeForm} onChange={setMinChargeForm} />
          </Field>
          {editingMinChargeType !== MIN_CHARGE_ACTIVE_SERVICE_TYPE && (
            <p style={{ fontSize: 12, color: colors.slateLight, marginBottom: 14 }}>
              Not yet read by any estimate flow — only {MIN_CHARGE_SERVICE_LABELS[MIN_CHARGE_ACTIVE_SERVICE_TYPE]} is
              wired into the Configurator today.
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setEditingMinChargeType(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMinCharge} disabled={savingMinCharge}>
              {savingMinCharge ? "Saving…" : "Save"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
