"use client";

import { useEffect, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin/adminApi";
import { PageHeader, Button, Input, Field, ErrorBanner, SuccessBanner, Modal, Spinner, colors } from "@/components/admin/ui";

interface InstallationRate {
  id: string;
  serviceType: "CCTV" | "ACCESS_CONTROL" | "INTERCOM" | "NETWORKING";
  baseRatePerUnit: number;
  floorModifier: number;
  heightAccessModifier: number;
  conduitTrunkingModifier: number;
  existingVsNewCablingModifier: number;
  configurationFee: number;
  remoteViewSetupFee: number;
  minimumCharge: number;
}

const SERVICE_TYPES: InstallationRate["serviceType"][] = ["CCTV", "ACCESS_CONTROL", "INTERCOM", "NETWORKING"];
const SERVICE_LABELS: Record<string, string> = {
  CCTV: "CCTV",
  ACCESS_CONTROL: "Access Control",
  INTERCOM: "Video Intercom",
  NETWORKING: "Networking & Cabling",
};

type FormState = {
  baseRatePerUnit: string;
  floorModifier: string;
  heightAccessModifier: string;
  conduitTrunkingModifier: string;
  existingVsNewCablingModifier: string;
  configurationFee: string;
  remoteViewSetupFee: string;
  minimumCharge: string;
};

function toForm(r?: InstallationRate): FormState {
  return {
    baseRatePerUnit: String(r?.baseRatePerUnit ?? 0),
    floorModifier: String(r?.floorModifier ?? 0),
    heightAccessModifier: String(r?.heightAccessModifier ?? 0),
    conduitTrunkingModifier: String(r?.conduitTrunkingModifier ?? 0),
    existingVsNewCablingModifier: String(r?.existingVsNewCablingModifier ?? 0),
    configurationFee: String(r?.configurationFee ?? 0),
    remoteViewSetupFee: String(r?.remoteViewSetupFee ?? 0),
    minimumCharge: String(r?.minimumCharge ?? 0),
  };
}

export default function InstallationRatesPage() {
  const [rates, setRates] = useState<InstallationRate[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editingType, setEditingType] = useState<InstallationRate["serviceType"] | null>(null);
  const [form, setForm] = useState<FormState>(toForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadAll() {
    setLoadError(null);
    try {
      const res = await adminFetch<{ rates: InstallationRate[] }>("/api/admin/installation-rates");
      setRates(res.rates);
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't load installation rates.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern, same precedent as ProductsPage
    loadAll();
  }, []);

  function openEdit(serviceType: InstallationRate["serviceType"]) {
    const existing = (rates ?? []).find((r) => r.serviceType === serviceType);
    setForm(toForm(existing));
    setFormError(null);
    setEditingType(serviceType);
  }

  async function handleSave() {
    if (!editingType) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      baseRatePerUnit: Number(form.baseRatePerUnit) || 0,
      floorModifier: Number(form.floorModifier) || 0,
      heightAccessModifier: Number(form.heightAccessModifier) || 0,
      conduitTrunkingModifier: Number(form.conduitTrunkingModifier) || 0,
      existingVsNewCablingModifier: Number(form.existingVsNewCablingModifier) || 0,
      configurationFee: Number(form.configurationFee) || 0,
      remoteViewSetupFee: Number(form.remoteViewSetupFee) || 0,
      minimumCharge: Number(form.minimumCharge) || 0,
    };
    try {
      await adminFetch(`/api/admin/installation-rates/${editingType}`, { method: "PATCH", body: JSON.stringify(payload) });
      setSuccessMessage(`${SERVICE_LABELS[editingType]} installation rate saved.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setEditingType(null);
      await loadAll();
    } catch (err) {
      setFormError(err instanceof AdminApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Installation Rates"
        description="Base rates and modifiers used to calculate installation cost. Each of the four service types is a fixed row — set once, edit as needed."
      />

      {successMessage && <SuccessBanner>{successMessage}</SuccessBanner>}
      {loadError && <ErrorBanner>{loadError}</ErrorBanner>}

      {rates === null ? (
        <Spinner />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {SERVICE_TYPES.map((type) => {
            const rate = rates.find((r) => r.serviceType === type);
            return (
              <div key={type} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, background: "#fff" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>{SERVICE_LABELS[type]}</div>
                {rate ? (
                  <>
                    <div style={{ fontSize: 12, color: colors.slate, marginBottom: 2 }}>Base: {rate.baseRatePerUnit.toLocaleString()} PKR/unit</div>
                    <div style={{ fontSize: 12, color: colors.slate, marginBottom: 10 }}>Minimum charge: {rate.minimumCharge.toLocaleString()} PKR</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: colors.slateLight, marginBottom: 10 }}>Not configured yet — currently routes to site survey.</div>
                )}
                <button onClick={() => openEdit(type)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, padding: 0 }}>
                  {rate ? "Edit" : "Configure"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editingType && (
        <Modal title={`${SERVICE_LABELS[editingType]} Installation Rate`} onClose={() => setEditingType(null)} wide>
          {formError && <ErrorBanner>{formError}</ErrorBanner>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Base rate per unit (PKR)">
              <Input type="number" value={form.baseRatePerUnit} onChange={(v) => setForm({ ...form, baseRatePerUnit: v })} />
            </Field>
            <Field label="Minimum charge (PKR)">
              <Input type="number" value={form.minimumCharge} onChange={(v) => setForm({ ...form, minimumCharge: v })} />
            </Field>
            <Field label="Floor modifier">
              <Input type="number" value={form.floorModifier} onChange={(v) => setForm({ ...form, floorModifier: v })} />
            </Field>
            <Field label="Height/access modifier">
              <Input type="number" value={form.heightAccessModifier} onChange={(v) => setForm({ ...form, heightAccessModifier: v })} />
            </Field>
            <Field label="Conduit/trunking modifier">
              <Input type="number" value={form.conduitTrunkingModifier} onChange={(v) => setForm({ ...form, conduitTrunkingModifier: v })} />
            </Field>
            <Field label="Existing vs. new cabling modifier">
              <Input type="number" value={form.existingVsNewCablingModifier} onChange={(v) => setForm({ ...form, existingVsNewCablingModifier: v })} />
            </Field>
            <Field label="Configuration fee (PKR)">
              <Input type="number" value={form.configurationFee} onChange={(v) => setForm({ ...form, configurationFee: v })} />
            </Field>
            <Field label="Remote view setup fee (PKR)">
              <Input type="number" value={form.remoteViewSetupFee} onChange={(v) => setForm({ ...form, remoteViewSetupFee: v })} />
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setEditingType(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
