"use client";

import { useState } from "react";
import { useSimpleEntityCrud } from "@/lib/admin/useSimpleEntityCrud";
import { PageHeader, Button, Input, Textarea, Select, Field, Badge, Table, EmptyRow, ErrorBanner, SuccessBanner, Modal, ConfirmDialog, Spinner, colors } from "@/components/admin/ui";

interface Service {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  quoteOnly: boolean;
  problemText: string | null;
  solutionText: string | null;
  suitableCustomersText: string | null;
  featuresText: string | null;
  considerationsText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

type FormState = {
  name: string;
  slug: string;
  shortDescription: string;
  quoteOnly: boolean;
  problemText: string;
  solutionText: string;
  suitableCustomersText: string;
  featuresText: string;
  considerationsText: string;
  seoTitle: string;
  seoDescription: string;
  status: string;
};
const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  shortDescription: "",
  quoteOnly: false,
  problemText: "",
  solutionText: "",
  suitableCustomersText: "",
  featuresText: "",
  considerationsText: "",
  seoTitle: "",
  seoDescription: "",
  status: "DRAFT",
};
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];

/**
 * Minimal admin CRUD for Service — deliberately no rich-text/FAQ authoring
 * here (faq stays null; processText/equipmentText/warrantyText likewise
 * unauthored via this form) since nothing currently reads them and adding
 * that UI now would be scope creep beyond what's needed to make the
 * database-backed public /services pages usable. suitableCustomersText and
 * featuresText are edited as one item per line, matching how
 * src/server/publicRoutes/serviceCatalogue.ts splits them back apart for
 * public display.
 */
export default function ServicesPage() {
  const crud = useSimpleEntityCrud<Service>({
    listUrl: "/api/admin/services",
    listKey: "services",
    itemUrl: (id) => `/api/admin/services/${id}`,
    itemKey: "service",
  });

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [archiving, setArchiving] = useState<Service | null>(null);

  const filtered = (crud.items ?? []).filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()));

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      name: s.name,
      slug: s.slug,
      shortDescription: s.shortDescription ?? "",
      quoteOnly: s.quoteOnly,
      problemText: s.problemText ?? "",
      solutionText: s.solutionText ?? "",
      suitableCustomersText: s.suitableCustomersText ?? "",
      featuresText: s.featuresText ?? "",
      considerationsText: s.considerationsText ?? "",
      seoTitle: s.seoTitle ?? "",
      seoDescription: s.seoDescription ?? "",
      status: s.status,
    });
    setShowForm(true);
  }

  async function handleSave() {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      shortDescription: form.shortDescription.trim() || null,
      quoteOnly: form.quoteOnly,
      problemText: form.problemText.trim() || null,
      solutionText: form.solutionText.trim() || null,
      suitableCustomersText: form.suitableCustomersText.trim() || null,
      featuresText: form.featuresText.trim() || null,
      considerationsText: form.considerationsText.trim() || null,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
      status: form.status,
    };
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
      <PageHeader title="Services" description="Public service pages shown at /services." action={<Button onClick={openCreate}>+ New Service</Button>} />

      {crud.successMessage && <SuccessBanner>{crud.successMessage}</SuccessBanner>}
      {crud.loadError && <ErrorBanner>{crud.loadError}</ErrorBanner>}

      <div style={{ maxWidth: 260, marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Search services…" />
      </div>

      {crud.items === null ? (
        <Spinner />
      ) : (
        <Table columns={["Name", "Slug", "Status", ""]}>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={4}>{crud.items.length === 0 ? "No services yet." : "No services match your search."}</EmptyRow>
          ) : (
            filtered.map((s) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{s.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{s.slug}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={s.status} />
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => openEdit(s)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, marginRight: 12 }}>
                    Edit
                  </button>
                  {s.status !== "ARCHIVED" && (
                    <button onClick={() => setArchiving(s)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
                      Archive
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      )}

      {showForm && (
        <Modal title={editing ? `Edit: ${editing.name}` : "New Service"} onClose={() => setShowForm(false)}>
          {crud.formError && <ErrorBanner>{crud.formError}</ErrorBanner>}
          <Field label="Name">
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={crud.formErrors.name} />
          </Field>
          <Field label="Slug">
            <Input value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="e.g. cctv-installation" error={crud.formErrors.slug} />
          </Field>
          <Field label="Short description (listing card blurb)">
            <Textarea value={form.shortDescription} onChange={(v) => setForm({ ...form, shortDescription: v })} rows={2} />
          </Field>
          <Field label="Problem">
            <Textarea value={form.problemText} onChange={(v) => setForm({ ...form, problemText: v })} rows={3} />
          </Field>
          <Field label="Solution">
            <Textarea value={form.solutionText} onChange={(v) => setForm({ ...form, solutionText: v })} rows={3} />
          </Field>
          <Field label="Suitable for (one per line)">
            <Textarea value={form.suitableCustomersText} onChange={(v) => setForm({ ...form, suitableCustomersText: v })} rows={3} />
          </Field>
          <Field label="What's typically involved (one per line)">
            <Textarea value={form.featuresText} onChange={(v) => setForm({ ...form, featuresText: v })} rows={3} />
          </Field>
          <Field label="Good to know / considerations">
            <Textarea value={form.considerationsText} onChange={(v) => setForm({ ...form, considerationsText: v })} rows={2} />
          </Field>
          <Field label="SEO title">
            <Input value={form.seoTitle} onChange={(v) => setForm({ ...form, seoTitle: v })} />
          </Field>
          <Field label="SEO description">
            <Textarea value={form.seoDescription} onChange={(v) => setForm({ ...form, seoDescription: v })} rows={2} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES.map((s) => ({ value: s, label: s }))} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={crud.saving}>
              {crud.saving ? "Saving…" : editing ? "Save changes" : "Create service"}
            </Button>
          </div>
        </Modal>
      )}

      {archiving && (
        <ConfirmDialog
          title="Archive service?"
          message={`"${archiving.name}" will no longer appear on the public /services pages. This can be reversed by editing its status back to Published.`}
          confirmLabel="Archive"
          danger
          onConfirm={handleArchive}
          onCancel={() => setArchiving(null)}
        />
      )}
    </div>
  );
}
