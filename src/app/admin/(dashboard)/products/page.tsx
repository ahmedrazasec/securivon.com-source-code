"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { adminFetch, adminUploadImage, AdminApiError, fieldErrors } from "@/lib/admin/adminApi";
import {
  PageHeader,
  Button,
  Input,
  Select,
  Textarea,
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

interface ProductImage {
  url: string;
  alt?: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  brandId: string;
  categoryId: string;
  productType: string;
  shortDescription: string | null;
  images: ProductImage[] | null;
  useCases: string[];
  warrantyId: string | null;
  supplierId: string | null;
  supplierCost: number | null;
  customerPriceType: string;
  customerPriceValue: number | null;
  customerPriceValueMax: number | null;
  installationPriceType: string;
  installationPriceValue: number | null;
  installationPriceValueMax: number | null;
  pricingStatus: "VERIFIED" | "NEEDS_REVIEW" | "STALE";
  availability: string;
  configuratorTags: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

interface Ref {
  id: string;
  name: string;
}

const PRICE_TYPES = ["FIXED", "STARTING_FROM", "RANGE", "ESTIMATED", "QUOTE_ONLY"];
const PRICING_STATUSES = ["VERIFIED", "NEEDS_REVIEW", "STALE"];
const AVAILABILITIES = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "ORDER_REQUIRED", "DISCONTINUED", "UNKNOWN"];
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];

type FormState = {
  slug: string;
  name: string;
  sku: string;
  brandId: string;
  categoryId: string;
  productType: string;
  shortDescription: string;
  images: ProductImage[];
  useCasesText: string;
  warrantyId: string;
  supplierId: string;
  supplierCost: string;
  customerPriceType: string;
  customerPriceValue: string;
  customerPriceValueMax: string;
  installationPriceType: string;
  installationPriceValue: string;
  installationPriceValueMax: string;
  pricingStatus: string;
  availability: string;
  configuratorTagsText: string;
  status: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  sku: "",
  brandId: "",
  categoryId: "",
  productType: "",
  shortDescription: "",
  images: [],
  useCasesText: "",
  warrantyId: "",
  supplierId: "",
  supplierCost: "",
  customerPriceType: "QUOTE_ONLY",
  customerPriceValue: "",
  customerPriceValueMax: "",
  installationPriceType: "QUOTE_ONLY",
  installationPriceValue: "",
  installationPriceValueMax: "",
  pricingStatus: "NEEDS_REVIEW",
  availability: "UNKNOWN",
  configuratorTagsText: "",
  status: "DRAFT",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Ref[]>([]);
  const [brands, setBrands] = useState<Ref[]>([]);
  const [warranties, setWarranties] = useState<Ref[]>([]);
  const [suppliers, setSuppliers] = useState<Ref[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [archiving, setArchiving] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function loadAll() {
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("categoryId", categoryFilter);

      const [productsRes, categoriesRes, brandsRes, warrantiesRes, suppliersRes] = await Promise.all([
        adminFetch<{ products: Product[] }>(`/api/admin/products?${params.toString()}`),
        adminFetch<{ categories: Ref[] }>("/api/admin/categories"),
        adminFetch<{ brands: Ref[] }>("/api/admin/brands"),
        adminFetch<{ warranties: Ref[] }>("/api/admin/warranties"),
        adminFetch<{ suppliers: Ref[] }>("/api/admin/suppliers"),
      ]);
      setProducts(productsRes.products);
      setCategories(categoriesRes.categories);
      setBrands(brandsRes.brands);
      setWarranties(warrantiesRes.warranties);
      setSuppliers(suppliersRes.suppliers);
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't load products.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/filter-change pattern; loadAll is intentionally reused as a standalone refetch after create/edit/archive too
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q));
  }, [products, search]);

  function nameOf(list: Ref[], id: string | null) {
    return list.find((x) => x.id === id)?.name ?? "—";
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      slug: p.slug,
      name: p.name,
      sku: p.sku ?? "",
      brandId: p.brandId,
      categoryId: p.categoryId,
      productType: p.productType,
      shortDescription: p.shortDescription ?? "",
      images: Array.isArray(p.images) ? p.images : [],
      useCasesText: p.useCases.join(", "),
      warrantyId: p.warrantyId ?? "",
      supplierId: p.supplierId ?? "",
      supplierCost: p.supplierCost != null ? String(p.supplierCost) : "",
      customerPriceType: p.customerPriceType,
      customerPriceValue: p.customerPriceValue != null ? String(p.customerPriceValue) : "",
      customerPriceValueMax: p.customerPriceValueMax != null ? String(p.customerPriceValueMax) : "",
      installationPriceType: p.installationPriceType,
      installationPriceValue: p.installationPriceValue != null ? String(p.installationPriceValue) : "",
      installationPriceValueMax: p.installationPriceValueMax != null ? String(p.installationPriceValueMax) : "",
      pricingStatus: p.pricingStatus,
      availability: p.availability,
      configuratorTagsText: p.configuratorTags.join(", "),
      status: p.status,
    });
    setFormErrors({});
    setFormError(null);
    setShowForm(true);
  }

  function num(v: string): number | null {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  // Drops rows where the URL field was left empty (added a row, changed
  // their mind), trims alt text, and sends null rather than [] when nothing
  // valid remains — matches how the rest of this form treats "no value".
  function cleanImages(images: ProductImage[]): ProductImage[] | null {
    const valid = images
      .filter((img) => img.url.trim() !== "")
      .map((img) => ({ url: img.url.trim(), ...(img.alt?.trim() ? { alt: img.alt.trim() } : {}) }));
    return valid.length > 0 ? valid : null;
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
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);
    try {
      const { url } = await adminUploadImage("product", file);
      setForm((prev) => ({ ...prev, images: [...prev.images, { url, alt: "" }] }));
    } catch (err) {
      setFormError(err instanceof AdminApiError ? err.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);
    setFormErrors({});

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      brandId: form.brandId,
      categoryId: form.categoryId,
      productType: form.productType.trim(),
      shortDescription: form.shortDescription.trim() || null,
      images: cleanImages(form.images),
      useCases: form.useCasesText.split(",").map((s) => s.trim()).filter(Boolean),
      warrantyId: form.warrantyId || null,
      supplierId: form.supplierId || null,
      supplierCost: num(form.supplierCost),
      customerPriceType: form.customerPriceType,
      customerPriceValue: num(form.customerPriceValue),
      customerPriceValueMax: num(form.customerPriceValueMax),
      installationPriceType: form.installationPriceType,
      installationPriceValue: num(form.installationPriceValue),
      installationPriceValueMax: num(form.installationPriceValueMax),
      pricingStatus: form.pricingStatus,
      availability: form.availability,
      configuratorTags: form.configuratorTagsText.split(",").map((s) => s.trim()).filter(Boolean),
      status: form.status,
    };

    try {
      if (editing) {
        await adminFetch(`/api/admin/products/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        setSuccessMessage(`"${form.name}" updated.`);
      } else {
        await adminFetch("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
        setSuccessMessage(`"${form.name}" created.`);
      }
      setShowForm(false);
      await loadAll();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      if (err instanceof AdminApiError) {
        setFormError(err.message);
        setFormErrors(fieldErrors(err.details));
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!archiving) return;
    try {
      await adminFetch(`/api/admin/products/${archiving.id}`, { method: "DELETE" });
      setSuccessMessage(`"${archiving.name}" archived.`);
      setArchiving(null);
      await loadAll();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't archive product.");
      setArchiving(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Create, edit, and archive products — pricing status is tracked separately from public pricing, so nothing unverified reaches the website by accident."
        action={<Button onClick={openCreate}>+ New Product</Button>}
      />

      {successMessage && <SuccessBanner>{successMessage}</SuccessBanner>}
      {loadError && <ErrorBanner>{loadError}</ErrorBanner>}

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ maxWidth: 260, flex: 1 }}>
          <Input value={search} onChange={setSearch} placeholder="Search name or SKU…" />
        </div>
        <div style={{ width: 180 }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All statuses"
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>
        <div style={{ width: 220 }}>
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="All categories"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
      </div>

      {products === null ? (
        <Spinner />
      ) : (
        <Table columns={["Name", "SKU", "Category", "Brand", "Availability", "Pricing Status", "Status", ""]}>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={8}>{products.length === 0 ? "No products yet." : "No products match your search."}</EmptyRow>
          ) : (
            filtered.map((p) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{p.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{p.sku ?? "—"}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{nameOf(categories, p.categoryId)}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{nameOf(brands, p.brandId)}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={p.availability} />
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={p.pricingStatus} />
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={p.status} />
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => openEdit(p)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, marginRight: 12 }}>
                    Edit
                  </button>
                  <button onClick={() => setArchiving(p)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
                    Archive
                  </button>
                </td>
              </tr>
            ))
          )}
        </Table>
      )}

      {showForm && (
        <Modal title={editing ? `Edit: ${editing.name}` : "New Product"} onClose={() => setShowForm(false)} wide>
          {formError && <ErrorBanner>{formError}</ErrorBanner>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Name">
              <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={formErrors.name} />
            </Field>
            <Field label="Slug">
              <Input value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} error={formErrors.slug} />
            </Field>
            <Field label="SKU">
              <Input value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
            </Field>
            <Field label="Product type">
              <Input value={form.productType} onChange={(v) => setForm({ ...form, productType: v })} placeholder="e.g. camera, recorder" error={formErrors.productType} />
            </Field>
            <Field label="Category">
              <Select
                value={form.categoryId}
                onChange={(v) => setForm({ ...form, categoryId: v })}
                placeholder="Select category"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                error={formErrors.categoryId}
              />
            </Field>
            <Field label="Brand">
              <Select
                value={form.brandId}
                onChange={(v) => setForm({ ...form, brandId: v })}
                placeholder="Select brand"
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
                error={formErrors.brandId}
              />
            </Field>
            <Field label="Warranty">
              <Select value={form.warrantyId} onChange={(v) => setForm({ ...form, warrantyId: v })} placeholder="None" options={warranties.map((w) => ({ value: w.id, label: w.name }))} />
            </Field>
            <Field label="Availability">
              <Select value={form.availability} onChange={(v) => setForm({ ...form, availability: v })} options={AVAILABILITIES.map((a) => ({ value: a, label: a.replace(/_/g, " ") }))} />
            </Field>
          </div>

          <Field label="Short description">
            <Textarea value={form.shortDescription} onChange={(v) => setForm({ ...form, shortDescription: v })} rows={2} />
          </Field>

          <div style={{ marginBottom: 14 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: colors.ink, marginBottom: 5 }}>
              Images
            </span>
            <p style={{ fontSize: 12, color: colors.slate, marginBottom: 8 }}>
              Upload an image directly, or paste a direct HTTPS image URL — both work the same way. The first image
              is used on product cards and as the main product photo; additional images appear as a gallery on the
              product page. Use the arrows to reorder.
            </p>
            {form.images.length === 0 && (
              <p style={{ fontSize: 12, color: colors.slateLight, marginBottom: 8 }}>No images added yet.</p>
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

          <Field label="Use cases (comma-separated)">
            <Input value={form.useCasesText} onChange={(v) => setForm({ ...form, useCasesText: v })} placeholder="e.g. home entrance, shop counter" />
          </Field>

          <Field label="Configurator tags (comma-separated)">
            <Input value={form.configuratorTagsText} onChange={(v) => setForm({ ...form, configuratorTagsText: v })} placeholder="e.g. standard, wide" />
          </Field>

          <hr style={{ border: "none", borderTop: `1px solid ${colors.border}`, margin: "18px 0" }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: colors.slate, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
            Supplier &amp; cost — internal only, never shown publicly
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Supplier">
              <Select value={form.supplierId} onChange={(v) => setForm({ ...form, supplierId: v })} placeholder="None" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label="Supplier cost (PKR)">
              <Input type="number" value={form.supplierCost} onChange={(v) => setForm({ ...form, supplierCost: v })} />
            </Field>
          </div>

          <hr style={{ border: "none", borderTop: `1px solid ${colors.border}`, margin: "18px 0" }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: colors.slate, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
            Customer-facing pricing
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Pricing status">
              <Select value={form.pricingStatus} onChange={(v) => setForm({ ...form, pricingStatus: v })} options={PRICING_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))} />
            </Field>
            <Field label="Product status">
              <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="Customer price type">
              <Select value={form.customerPriceType} onChange={(v) => setForm({ ...form, customerPriceType: v })} options={PRICE_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))} />
            </Field>
            <Field label="Installation price type">
              <Select
                value={form.installationPriceType}
                onChange={(v) => setForm({ ...form, installationPriceType: v })}
                options={PRICE_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))}
              />
            </Field>
            <Field label="Customer price">
              <Input type="number" value={form.customerPriceValue} onChange={(v) => setForm({ ...form, customerPriceValue: v })} />
            </Field>
            <Field label="Customer price (max, for range)">
              <Input type="number" value={form.customerPriceValueMax} onChange={(v) => setForm({ ...form, customerPriceValueMax: v })} />
            </Field>
            <Field label="Installation price">
              <Input type="number" value={form.installationPriceValue} onChange={(v) => setForm({ ...form, installationPriceValue: v })} />
            </Field>
            <Field label="Installation price (max, for range)">
              <Input type="number" value={form.installationPriceValueMax} onChange={(v) => setForm({ ...form, installationPriceValueMax: v })} />
            </Field>
          </div>
          {form.pricingStatus !== "VERIFIED" && (
            <p style={{ fontSize: 12, color: colors.warn, background: colors.warnBg, border: `1px solid ${colors.warnBorder}`, borderRadius: 6, padding: "8px 10px", marginTop: 4 }}>
              This pricing status means the public website will show &quot;price on request&quot; instead of these values, regardless of what&rsquo;s entered above — that only changes once
              this is set to VERIFIED.
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 22 }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
            </Button>
          </div>
        </Modal>
      )}

      {archiving && (
        <ConfirmDialog
          title="Archive product?"
          message={`"${archiving.name}" will be archived and hidden from the public site. This can be reversed later by editing its status.`}
          confirmLabel="Archive"
          danger
          onConfirm={handleArchive}
          onCancel={() => setArchiving(null)}
        />
      )}
    </div>
  );
}
