"use client";

import { useState } from "react";
import { useSimpleEntityCrud } from "@/lib/admin/useSimpleEntityCrud";
import { PageHeader, Button, Input, Textarea, Select, Field, Badge, Table, EmptyRow, ErrorBanner, SuccessBanner, Modal, ConfirmDialog, Spinner, colors } from "@/components/admin/ui";

interface Supplier {
  id: string;
  name: string;
  contactInfo: { phone?: string; email?: string; address?: string } | null;
  tier: "PRIMARY" | "STRONG" | "DISCOVERY";
  notes: string | null;
}

type FormState = { name: string; phone: string; email: string; address: string; tier: string; notes: string };
const EMPTY_FORM: FormState = { name: "", phone: "", email: "", address: "", tier: "DISCOVERY", notes: "" };
const TIERS = ["PRIMARY", "STRONG", "DISCOVERY"];

/**
 * This entire page is internal-only, cost-adjacent data — the API itself
 * requires "EDIT_PRICING" for read access too (not just VIEW_ADMIN, see
 * src/server/adminRoutes/catalogueSupport.ts), and nothing here is ever
 * passed through src/server/serializers/* to any public response.
 */
export default function SuppliersPage() {
  const crud = useSimpleEntityCrud<Supplier>({
    listUrl: "/api/admin/suppliers",
    listKey: "suppliers",
    itemUrl: (id) => `/api/admin/suppliers/${id}`,
    itemKey: "supplier",
  });

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [archiving, setArchiving] = useState<Supplier | null>(null);

  const filtered = (crud.items ?? []).filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()));

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      phone: s.contactInfo?.phone ?? "",
      email: s.contactInfo?.email ?? "",
      address: s.contactInfo?.address ?? "",
      tier: s.tier,
      notes: s.notes ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    const contactInfo =
      form.phone.trim() || form.email.trim() || form.address.trim()
        ? { phone: form.phone.trim() || undefined, email: form.email.trim() || undefined, address: form.address.trim() || undefined }
        : null;
    const payload = { name: form.name.trim(), contactInfo, tier: form.tier, notes: form.notes.trim() || null };
    const ok = editing ? await crud.update(editing.id, payload, form.name) : await crud.create(payload, form.name);
    if (ok) setShowForm(false);
  }

  async function handleArchive() {
    if (!archiving) return;
    await crud.deactivate(archiving.id, archiving.name);
    setArchiving(null);
  }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Internal supplier records — never shown on the public website."
        action={<Button onClick={openCreate}>+ New Supplier</Button>}
      />

      {crud.successMessage && <SuccessBanner>{crud.successMessage}</SuccessBanner>}
      {crud.loadError && <ErrorBanner>{crud.loadError}</ErrorBanner>}

      <div style={{ maxWidth: 260, marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Search suppliers…" />
      </div>

      {crud.items === null ? (
        <Spinner />
      ) : (
        <Table columns={["Name", "Phone", "Email", "Tier", ""]}>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={5}>{crud.items.length === 0 ? "No suppliers yet." : "No suppliers match your search."}</EmptyRow>
          ) : (
            filtered.map((s) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{s.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{s.contactInfo?.phone ?? "—"}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{s.contactInfo?.email ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={s.tier === "PRIMARY" ? "VERIFIED" : s.tier === "STRONG" ? "NEEDS_REVIEW" : "QUOTE_ONLY"} />
                  <span style={{ marginLeft: 6, fontSize: 12, color: colors.slate }}>{s.tier}</span>
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => openEdit(s)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, marginRight: 12 }}>
                    Edit
                  </button>
                  <button onClick={() => setArchiving(s)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
                    Archive
                  </button>
                </td>
              </tr>
            ))
          )}
        </Table>
      )}

      {showForm && (
        <Modal title={editing ? `Edit: ${editing.name}` : "New Supplier"} onClose={() => setShowForm(false)}>
          {crud.formError && <ErrorBanner>{crud.formError}</ErrorBanner>}
          <Field label="Name">
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={crud.formErrors.name} />
          </Field>
          <Field label="Tier">
            <Select value={form.tier} onChange={(v) => setForm({ ...form, tier: v })} options={TIERS.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          </Field>
          <Field label="Internal notes">
            <Textarea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={3} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={crud.saving}>
              {crud.saving ? "Saving…" : editing ? "Save changes" : "Create supplier"}
            </Button>
          </div>
        </Modal>
      )}

      {archiving && (
        <ConfirmDialog
          title="Archive supplier?"
          message={`"${archiving.name}" will be archived. Products already linked to this supplier keep the reference.`}
          confirmLabel="Archive"
          danger
          onConfirm={handleArchive}
          onCancel={() => setArchiving(null)}
        />
      )}
    </div>
  );
}
