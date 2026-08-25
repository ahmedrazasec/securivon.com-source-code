"use client";

import { useState } from "react";
import { useSimpleEntityCrud } from "@/lib/admin/useSimpleEntityCrud";
import { PageHeader, Button, Input, Textarea, Select, Field, Badge, Table, EmptyRow, ErrorBanner, SuccessBanner, Modal, ConfirmDialog, Spinner, colors } from "@/components/admin/ui";

interface Warranty {
  id: string;
  name: string;
  durationMonths: number;
  provider: "MANUFACTURER" | "SECURIVON" | "DISTRIBUTOR";
  warrantyType: string | null;
  conditionsText: string | null;
  exclusionsText: string | null;
  active: boolean;
}

type FormState = {
  name: string;
  durationMonths: string;
  provider: string;
  warrantyType: string;
  conditionsText: string;
  exclusionsText: string;
  active: boolean;
};
const EMPTY_FORM: FormState = {
  name: "",
  durationMonths: "12",
  provider: "MANUFACTURER",
  warrantyType: "",
  conditionsText: "",
  exclusionsText: "",
  active: true,
};
const PROVIDERS = ["MANUFACTURER", "SECURIVON", "DISTRIBUTOR"];

export default function WarrantiesPage() {
  const crud = useSimpleEntityCrud<Warranty>({
    listUrl: "/api/admin/warranties",
    listKey: "warranties",
    itemUrl: (id) => `/api/admin/warranties/${id}`,
    itemKey: "warranty",
  });

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Warranty | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deactivating, setDeactivating] = useState<Warranty | null>(null);

  const filtered = (crud.items ?? []).filter((w) => w.name.toLowerCase().includes(search.trim().toLowerCase()));

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(w: Warranty) {
    setEditing(w);
    setForm({
      name: w.name,
      durationMonths: String(w.durationMonths),
      provider: w.provider,
      warrantyType: w.warrantyType ?? "",
      conditionsText: w.conditionsText ?? "",
      exclusionsText: w.exclusionsText ?? "",
      active: w.active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    const payload = {
      name: form.name.trim(),
      durationMonths: Number(form.durationMonths) || 0,
      provider: form.provider,
      warrantyType: form.warrantyType.trim() || null,
      conditionsText: form.conditionsText.trim() || null,
      exclusionsText: form.exclusionsText.trim() || null,
      active: form.active,
    };
    const ok = editing ? await crud.update(editing.id, payload, form.name) : await crud.create(payload, form.name);
    if (ok) setShowForm(false);
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    await crud.deactivate(deactivating.id, deactivating.name);
    setDeactivating(null);
  }

  return (
    <div>
      <PageHeader title="Warranties" description="Warranty terms attached to products." action={<Button onClick={openCreate}>+ New Warranty</Button>} />

      {crud.successMessage && <SuccessBanner>{crud.successMessage}</SuccessBanner>}
      {crud.loadError && <ErrorBanner>{crud.loadError}</ErrorBanner>}

      <div style={{ maxWidth: 260, marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Search warranties…" />
      </div>

      {crud.items === null ? (
        <Spinner />
      ) : (
        <Table columns={["Name", "Duration", "Provider", "Status", ""]}>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={5}>{crud.items.length === 0 ? "No warranties yet." : "No warranties match your search."}</EmptyRow>
          ) : (
            filtered.map((w) => (
              <tr key={w.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{w.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{w.durationMonths} months</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{w.provider}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={w.active ? "PUBLISHED" : "ARCHIVED"} />
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => openEdit(w)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, marginRight: 12 }}>
                    Edit
                  </button>
                  {w.active && (
                    <button onClick={() => setDeactivating(w)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      )}

      {showForm && (
        <Modal title={editing ? `Edit: ${editing.name}` : "New Warranty"} onClose={() => setShowForm(false)}>
          {crud.formError && <ErrorBanner>{crud.formError}</ErrorBanner>}
          <Field label="Name">
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={crud.formErrors.name} />
          </Field>
          <Field label="Duration (months)">
            <Input type="number" value={form.durationMonths} onChange={(v) => setForm({ ...form, durationMonths: v })} error={crud.formErrors.durationMonths} />
          </Field>
          <Field label="Provider">
            <Select value={form.provider} onChange={(v) => setForm({ ...form, provider: v })} options={PROVIDERS.map((p) => ({ value: p, label: p }))} />
          </Field>
          <Field label="Warranty type">
            <Input value={form.warrantyType} onChange={(v) => setForm({ ...form, warrantyType: v })} placeholder="e.g. Parts & labor" />
          </Field>
          <Field label="Conditions">
            <Textarea value={form.conditionsText} onChange={(v) => setForm({ ...form, conditionsText: v })} rows={2} />
          </Field>
          <Field label="Exclusions">
            <Textarea value={form.exclusionsText} onChange={(v) => setForm({ ...form, exclusionsText: v })} rows={2} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={crud.saving}>
              {crud.saving ? "Saving…" : editing ? "Save changes" : "Create warranty"}
            </Button>
          </div>
        </Modal>
      )}

      {deactivating && (
        <ConfirmDialog
          title="Deactivate warranty?"
          message={`"${deactivating.name}" will no longer be selectable for new products. Existing products keep it. You can reactivate it later.`}
          confirmLabel="Deactivate"
          danger
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivating(null)}
        />
      )}
    </div>
  );
}
