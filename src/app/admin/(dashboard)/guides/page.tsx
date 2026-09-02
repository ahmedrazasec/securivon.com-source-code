"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { useSimpleEntityCrud } from "@/lib/admin/useSimpleEntityCrud";
import { adminUploadImage, AdminApiError } from "@/lib/admin/adminApi";
import { PageHeader, Button, Input, Textarea, Select, Field, Badge, Table, EmptyRow, ErrorBanner, SuccessBanner, Modal, ConfirmDialog, Spinner, colors } from "@/components/admin/ui";

interface GuideImage {
  url: string;
  alt?: string;
}

interface Guide {
  id: string;
  slug: string;
  title: string;
  body: string;
  images: GuideImage[] | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
}

type FormState = {
  title: string;
  slug: string;
  body: string;
  images: GuideImage[];
  seoTitle: string;
  seoDescription: string;
  status: string;
};
const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  body: "",
  images: [],
  seoTitle: "",
  seoDescription: "",
  status: "DRAFT",
};
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];

/**
 * Admin CRUD for Guide — same minimal convention as the Services admin
 * page (src/app/admin/(dashboard)/services/page.tsx). `body` is authored
 * as plain text using a small explicit convention documented in
 * src/lib/marketing/guideContent.ts (blank line = new block, "## " =
 * subheading, "- " lines = a bullet list) — not a rich-text editor, so
 * this textarea is genuinely all the authoring UI needed. Images reuse the
 * exact same editor pattern as the admin Product/Package forms (upload via
 * POST /api/admin/upload, or paste an external URL — both populate the
 * same `images` array).
 */
export default function GuidesPage() {
  const crud = useSimpleEntityCrud<Guide>({
    listUrl: "/api/admin/guides",
    listKey: "guides",
    itemUrl: (id) => `/api/admin/guides/${id}`,
    itemKey: "guide",
  });

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Guide | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [archiving, setArchiving] = useState<Guide | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const filtered = (crud.items ?? []).filter((g) => g.title.toLowerCase().includes(search.trim().toLowerCase()));

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageUploadError(null);
    setShowForm(true);
  }

  function openEdit(g: Guide) {
    setEditing(g);
    setForm({
      title: g.title,
      slug: g.slug,
      body: g.body,
      images: Array.isArray(g.images) ? g.images : [],
      seoTitle: g.seoTitle ?? "",
      seoDescription: g.seoDescription ?? "",
      status: g.status,
    });
    setImageUploadError(null);
    setShowForm(true);
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= form.images.length) return;
    const next = [...form.images];
    [next[index], next[target]] = [next[target], next[index]];
    setForm({ ...form, images: next });
  }

  async function handleImageFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    setImageUploadError(null);
    try {
      const { url } = await adminUploadImage("guide", file);
      setForm((prev) => ({ ...prev, images: [...prev.images, { url, alt: "" }] }));
    } catch (err) {
      setImageUploadError(err instanceof AdminApiError ? err.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  function cleanImages(images: GuideImage[]): GuideImage[] | null {
    const valid = images
      .filter((img) => img.url.trim() !== "")
      .map((img) => ({ url: img.url.trim(), ...(img.alt?.trim() ? { alt: img.alt.trim() } : {}) }));
    return valid.length > 0 ? valid : null;
  }

  async function handleSave() {
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      body: form.body.trim(),
      images: cleanImages(form.images),
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
      status: form.status,
    };
    const ok = editing ? await crud.update(editing.id, payload, form.title) : await crud.create(payload, form.title);
    if (ok) setShowForm(false);
  }

  async function handleArchive() {
    if (!archiving) return;
    await crud.deactivate(archiving.id, archiving.title);
    setArchiving(null);
  }

  return (
    <div>
      <PageHeader title="Guides" description="Educational content shown at /guides." action={<Button onClick={openCreate}>+ New Guide</Button>} />

      {crud.successMessage && <SuccessBanner>{crud.successMessage}</SuccessBanner>}
      {crud.loadError && <ErrorBanner>{crud.loadError}</ErrorBanner>}

      <div style={{ maxWidth: 260, marginBottom: 16 }}>
        <Input value={search} onChange={setSearch} placeholder="Search guides…" />
      </div>

      {crud.items === null ? (
        <Spinner />
      ) : (
        <Table columns={["Title", "Slug", "Status", ""]}>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={4}>{crud.items.length === 0 ? "No guides yet." : "No guides match your search."}</EmptyRow>
          ) : (
            filtered.map((g) => (
              <tr key={g.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{g.title}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{g.slug}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={g.status} />
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => openEdit(g)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, marginRight: 12 }}>
                    Edit
                  </button>
                  {g.status !== "ARCHIVED" && (
                    <button onClick={() => setArchiving(g)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
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
        <Modal title={editing ? `Edit: ${editing.title}` : "New Guide"} onClose={() => setShowForm(false)}>
          {crud.formError && <ErrorBanner>{crud.formError}</ErrorBanner>}
          <Field label="Title">
            <Input value={form.title} onChange={(v) => setForm({ ...form, title: v })} error={crud.formErrors.title} />
          </Field>
          <Field label="Slug">
            <Input value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="e.g. how-many-cctv-cameras-do-i-need" error={crud.formErrors.slug} />
          </Field>
          <Field label="Body">
            <Textarea value={form.body} onChange={(v) => setForm({ ...form, body: v })} rows={12} />
          </Field>
          <p style={{ fontSize: 12, color: colors.slate, marginTop: -8, marginBottom: 14 }}>
            Separate paragraphs with a blank line. Start a line with &ldquo;## &rdquo; for a subheading, or a block of
            lines with &ldquo;- &rdquo; for a checklist.
          </p>

          <div style={{ marginBottom: 14 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: colors.ink, marginBottom: 5 }}>
              Cover image
            </span>
            {imageUploadError && <ErrorBanner>{imageUploadError}</ErrorBanner>}
            <p style={{ fontSize: 12, color: colors.slate, marginBottom: 8 }}>
              Upload an image directly, or paste a direct HTTPS image URL — both work the same way. The first image
              is the guide&rsquo;s cover photo. Optional — guides display fine with no image.
            </p>
            {form.images.length === 0 && (
              <p style={{ fontSize: 12, color: colors.slateLight, marginBottom: 8 }}>No image added yet.</p>
            )}
            {form.images.map((img, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    aria-label="Move image up"
                    style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? colors.slateLight : colors.slate, fontSize: 12, lineHeight: 1, padding: 2 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === form.images.length - 1}
                    aria-label="Move image down"
                    style={{ background: "none", border: "none", cursor: i === form.images.length - 1 ? "default" : "pointer", color: i === form.images.length - 1 ? colors.slateLight : colors.slate, fontSize: 12, lineHeight: 1, padding: 2 }}
                  >
                    ▼
                  </button>
                </div>
                <div style={{ flex: 2 }}>
                  <Input
                    value={img.url}
                    onChange={(v) => {
                      const next = [...form.images];
                      next[i] = { ...next[i], url: v };
                      setForm({ ...form, images: next });
                    }}
                    placeholder="https://…/image.jpg"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    value={img.alt ?? ""}
                    onChange={(v) => {
                      const next = [...form.images];
                      next[i] = { ...next[i], alt: v };
                      setForm({ ...form, images: next });
                    }}
                    placeholder="Alt text (optional)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })}
                  aria-label="Remove image"
                  style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13, padding: "8px 4px" }}
                >
                  Remove
                </button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Button variant="secondary" onClick={() => setForm({ ...form, images: [...form.images, { url: "", alt: "" }] })}>
                + Add image URL
              </Button>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: uploadingImage ? colors.slateLight : colors.ink,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  padding: "8px 14px",
                  cursor: uploadingImage ? "default" : "pointer",
                  background: "#fff",
                }}
              >
                {uploadingImage ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageFileSelected}
                  disabled={uploadingImage}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>

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
              {crud.saving ? "Saving…" : editing ? "Save changes" : "Create guide"}
            </Button>
          </div>
        </Modal>
      )}

      {archiving && (
        <ConfirmDialog
          title="Archive guide?"
          message={`"${archiving.title}" will no longer appear on the public /guides pages. This can be reversed by editing its status back to Published.`}
          confirmLabel="Archive"
          danger
          onConfirm={handleArchive}
          onCancel={() => setArchiving(null)}
        />
      )}
    </div>
  );
}
