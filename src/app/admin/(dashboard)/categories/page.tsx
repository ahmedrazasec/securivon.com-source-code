"use client";

import { useState } from "react";
import { useSimpleEntityCrud } from "@/lib/admin/useSimpleEntityCrud";
import {
  PageHeader,
  Button,
  Input,
  Textarea,
  Select,
  Field,
  Badge,
  Table,
  EmptyRow,
  ErrorBanner,
  SuccessBanner,
  Modal,
  ConfirmDialog,
  Spinner,
  colors,
} from "@/components/admin/ui";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  parentCategoryId: string | null;
}

type FormState = { name: string; slug: string; description: string; sortOrder: string; parentCategoryId: string; active: boolean };
const EMPTY_FORM: FormState = { name: "", slug: "", description: "", sortOrder: "0", parentCategoryId: "", active: true };

export default function CategoriesPage() {
  const crud = useSimpleEntityCrud<Category>({
    listUrl: "/api/admin/categories",
    listKey: "categories",
    itemUrl: (id) => `/api/admin/categories/${id}`,
    itemKey: "category",
  });

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deactivating, setDeactivating] = useState<Category | null>(null);

  const filtered = (crud.items ?? []).filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      sortOrder: String(c.sortOrder),
      parentCategoryId: c.parentCategoryId ?? "",
      active: c.active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      parentCategoryId: form.parentCategoryId || null,
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
      <PageHeader
        title="Categories"
        description="Product categories used across the catalogue and configurator."
        action={<Button onClick={openCreate}>+ New Category</Button>}
      />

      {crud.successMessage && <SuccessBanner>{crud.successMessage}</SuccessBanner>}
      {crud.loadError && <ErrorBanner>{crud.loadError}</ErrorBanner>}

      <div style={{ maxWidth: 260, marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Search categories…" />
      </div>

      {crud.items === null ? (
        <Spinner />
      ) : (
        <Table columns={["Name", "Slug", "Sort Order", "Status", ""]}>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={5}>{crud.items.length === 0 ? "No categories yet." : "No categories match your search."}</EmptyRow>
          ) : (
            filtered.map((c) => (
              <tr key={c.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{c.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{c.slug}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{c.sortOrder}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={c.active ? "PUBLISHED" : "ARCHIVED"} />
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => openEdit(c)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, marginRight: 12 }}>
                    Edit
                  </button>
                  {c.active && (
                    <button onClick={() => setDeactivating(c)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
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
        <Modal title={editing ? `Edit: ${editing.name}` : "New Category"} onClose={() => setShowForm(false)}>
          {crud.formError && <ErrorBanner>{crud.formError}</ErrorBanner>}
          <Field label="Name">
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={crud.formErrors.name} />
          </Field>
          <Field label="Slug">
            <Input value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} error={crud.formErrors.slug} />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={2} />
          </Field>
          <Field label="Sort order">
            <Input type="number" value={form.sortOrder} onChange={(v) => setForm({ ...form, sortOrder: v })} />
          </Field>
          <Field label="Parent category">
            <Select
              value={form.parentCategoryId}
              onChange={(v) => setForm({ ...form, parentCategoryId: v })}
              placeholder="None"
              options={(crud.items ?? []).filter((c) => c.id !== editing?.id).map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.active ? "active" : "inactive"}
              onChange={(v) => setForm({ ...form, active: v === "active" })}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={crud.saving}>
              {crud.saving ? "Saving…" : editing ? "Save changes" : "Create category"}
            </Button>
          </div>
        </Modal>
      )}

      {deactivating && (
        <ConfirmDialog
          title="Deactivate category?"
          message={`"${deactivating.name}" will be hidden from the public site and configurator. You can reactivate it later by editing its status.`}
          confirmLabel="Deactivate"
          danger
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivating(null)}
        />
      )}
    </div>
  );
}
