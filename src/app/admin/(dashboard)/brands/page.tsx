"use client";

import { useState } from "react";
import { useSimpleEntityCrud } from "@/lib/admin/useSimpleEntityCrud";
import { PageHeader, Button, Input, Textarea, Field, Badge, Table, EmptyRow, ErrorBanner, SuccessBanner, Modal, ConfirmDialog, Spinner, colors } from "@/components/admin/ui";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  countryOfOrigin: string | null;
  description: string | null;
  websiteUrl: string | null;
  active: boolean;
}

type FormState = { name: string; slug: string; logoUrl: string; countryOfOrigin: string; description: string; websiteUrl: string; active: boolean };
const EMPTY_FORM: FormState = { name: "", slug: "", logoUrl: "", countryOfOrigin: "", description: "", websiteUrl: "", active: true };

export default function BrandsPage() {
  const crud = useSimpleEntityCrud<Brand>({
    listUrl: "/api/admin/brands",
    listKey: "brands",
    itemUrl: (id) => `/api/admin/brands/${id}`,
    itemKey: "brand",
  });

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Brand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deactivating, setDeactivating] = useState<Brand | null>(null);

  const filtered = (crud.items ?? []).filter((b) => b.name.toLowerCase().includes(search.trim().toLowerCase()));

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(b: Brand) {
    setEditing(b);
    setForm({
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl ?? "",
      countryOfOrigin: b.countryOfOrigin ?? "",
      description: b.description ?? "",
      websiteUrl: b.websiteUrl ?? "",
      active: b.active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      logoUrl: form.logoUrl.trim() || null,
      countryOfOrigin: form.countryOfOrigin.trim() || null,
      description: form.description.trim() || null,
      websiteUrl: form.websiteUrl.trim() || null,
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
      <PageHeader title="Brands" description="Manufacturer/brand records used by products." action={<Button onClick={openCreate}>+ New Brand</Button>} />

      {crud.successMessage && <SuccessBanner>{crud.successMessage}</SuccessBanner>}
      {crud.loadError && <ErrorBanner>{crud.loadError}</ErrorBanner>}

      <div style={{ maxWidth: 260, marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Search brands…" />
      </div>

      {crud.items === null ? (
        <Spinner />
      ) : (
        <Table columns={["Name", "Slug", "Country of Origin", "Status", ""]}>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={5}>{crud.items.length === 0 ? "No brands yet." : "No brands match your search."}</EmptyRow>
          ) : (
            filtered.map((b) => (
              <tr key={b.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{b.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{b.slug}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{b.countryOfOrigin ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={b.active ? "PUBLISHED" : "ARCHIVED"} />
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => openEdit(b)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, marginRight: 12 }}>
                    Edit
                  </button>
                  {b.active && (
                    <button onClick={() => setDeactivating(b)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
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
        <Modal title={editing ? `Edit: ${editing.name}` : "New Brand"} onClose={() => setShowForm(false)}>
          {crud.formError && <ErrorBanner>{crud.formError}</ErrorBanner>}
          <Field label="Name">
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={crud.formErrors.name} />
          </Field>
          <Field label="Slug">
            <Input value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} error={crud.formErrors.slug} />
          </Field>
          <Field label="Country of origin">
            <Input value={form.countryOfOrigin} onChange={(v) => setForm({ ...form, countryOfOrigin: v })} />
          </Field>
          <Field label="Website URL">
            <Input value={form.websiteUrl} onChange={(v) => setForm({ ...form, websiteUrl: v })} placeholder="https://…" error={crud.formErrors.websiteUrl} />
          </Field>
          <Field label="Logo URL">
            <Input value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} placeholder="https://…" />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={2} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={crud.saving}>
              {crud.saving ? "Saving…" : editing ? "Save changes" : "Create brand"}
            </Button>
          </div>
        </Modal>
      )}

      {deactivating && (
        <ConfirmDialog
          title="Deactivate brand?"
          message={`"${deactivating.name}" will be hidden from the public site. You can reactivate it later by editing its status.`}
          confirmLabel="Deactivate"
          danger
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivating(null)}
        />
      )}
    </div>
  );
}
