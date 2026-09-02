"use client";

import { useEffect, useState } from "react";
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

interface PackageItem {
  id: string;
  packageId: string;
  productId: string;
  quantity: number;
  requirement: "REQUIRED" | "OPTIONAL";
  inclusionStatus: "INCLUDED" | "EXCLUDED" | "OPTIONAL_ADDON";
  priceOverride: number | null;
  customerFacingDescription: string | null;
  internalNotes: string | null;
  displayOrder: number;
}

interface PackageImage {
  url: string;
  alt?: string;
}

interface Package {
  id: string;
  slug: string;
  name: string;
  targetCustomerDescription: string | null;
  category: string;
  images: PackageImage[] | null;
  cameraCount: number | null;
  cameraTypeSummary: string | null;
  recorderProductId: string | null;
  storageSummary: string | null;
  networkingSummary: string | null;
  cablingAssumptionText: string | null;
  powerSummary: string | null;
  installationSummary: string | null;
  warrantyId: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  priceType: string;
  priceValue: number | null;
  priceValueMax: number | null;
  priceVerificationDate: string | null;
  configuratorPrefill: unknown;
  items: PackageItem[];
}

interface Ref {
  id: string;
  name: string;
}

const CATEGORIES = ["HOME_STARTER", "HOME_COMPLETE", "SHOP_RETAIL", "OFFICE", "RESTAURANT_CAFE", "CUSTOM"];
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const PRICE_TYPES = ["FIXED", "STARTING_FROM", "RANGE", "ESTIMATED", "QUOTE_ONLY"];

type PkgFormState = {
  slug: string;
  name: string;
  targetCustomerDescription: string;
  category: string;
  images: PackageImage[];
  cameraCount: string;
  cameraTypeSummary: string;
  recorderProductId: string;
  storageSummary: string;
  networkingSummary: string;
  cablingAssumptionText: string;
  powerSummary: string;
  installationSummary: string;
  warrantyId: string;
  status: string;
  priceType: string;
  priceValue: string;
  priceValueMax: string;
  priceVerificationDate: string;
  configuratorPrefillJson: string;
};
const EMPTY_PKG_FORM: PkgFormState = {
  slug: "",
  name: "",
  targetCustomerDescription: "",
  category: "HOME_STARTER",
  images: [],
  cameraCount: "",
  cameraTypeSummary: "",
  recorderProductId: "",
  storageSummary: "",
  networkingSummary: "",
  cablingAssumptionText: "",
  powerSummary: "",
  installationSummary: "",
  warrantyId: "",
  status: "DRAFT",
  priceType: "QUOTE_ONLY",
  priceValue: "",
  priceValueMax: "",
  priceVerificationDate: "",
  configuratorPrefillJson: "",
};

type ItemFormState = {
  productId: string;
  quantity: string;
  requirement: string;
  inclusionStatus: string;
  priceOverride: string;
  customerFacingDescription: string;
};
const EMPTY_ITEM_FORM: ItemFormState = {
  productId: "",
  quantity: "1",
  requirement: "REQUIRED",
  inclusionStatus: "INCLUDED",
  priceOverride: "",
  customerFacingDescription: "",
};

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Same behavior as the Product admin form's image cleanup — drop empty-URL
// rows, trim alt text, send null rather than [] when nothing valid remains.
function cleanImages(images: PackageImage[]): PackageImage[] | null {
  const valid = images
    .filter((img) => img.url.trim() !== "")
    .map((img) => ({ url: img.url.trim(), ...(img.alt?.trim() ? { alt: img.alt.trim() } : {}) }));
  return valid.length > 0 ? valid : null;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[] | null>(null);
  const [products, setProducts] = useState<Ref[]>([]);
  const [warranties, setWarranties] = useState<Ref[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editing, setEditing] = useState<Package | null>(null);
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [pkgForm, setPkgForm] = useState<PkgFormState>(EMPTY_PKG_FORM);
  const [pkgFormError, setPkgFormError] = useState<string | null>(null);
  const [pkgFormErrors, setPkgFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState<Package | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [managingItems, setManagingItems] = useState<Package | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [itemFormError, setItemFormError] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  async function loadAll() {
    setLoadError(null);
    try {
      const [pkgRes, prodRes, warrRes] = await Promise.all([
        adminFetch<{ packages: Package[] }>("/api/admin/packages"),
        adminFetch<{ products: Ref[] }>("/api/admin/products"),
        adminFetch<{ warranties: Ref[] }>("/api/admin/warranties"),
      ]);
      setPackages(pkgRes.packages);
      setProducts(prodRes.products);
      setWarranties(warrRes.warranties);
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't load packages.");
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

  function productName(id: string) {
    return products.find((p) => p.id === id)?.name ?? "(unknown product)";
  }

  // --- Package create/edit ---

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= pkgForm.images.length) return;
    const next = [...pkgForm.images];
    [next[index], next[target]] = [next[target], next[index]];
    setPkgForm({ ...pkgForm, images: next });
  }

  async function handleImageFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    setPkgFormError(null);
    try {
      const { url } = await adminUploadImage("package", file);
      setPkgForm((prev) => ({ ...prev, images: [...prev.images, { url, alt: "" }] }));
    } catch (err) {
      setPkgFormError(err instanceof AdminApiError ? err.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setPkgForm(EMPTY_PKG_FORM);
    setPkgFormError(null);
    setPkgFormErrors({});
    setShowPkgForm(true);
  }

  function openEdit(p: Package) {
    setEditing(p);
    setPkgForm({
      slug: p.slug,
      name: p.name,
      targetCustomerDescription: p.targetCustomerDescription ?? "",
      category: p.category,
      images: Array.isArray(p.images) ? p.images : [],
      cameraCount: p.cameraCount != null ? String(p.cameraCount) : "",
      cameraTypeSummary: p.cameraTypeSummary ?? "",
      recorderProductId: p.recorderProductId ?? "",
      storageSummary: p.storageSummary ?? "",
      networkingSummary: p.networkingSummary ?? "",
      cablingAssumptionText: p.cablingAssumptionText ?? "",
      powerSummary: p.powerSummary ?? "",
      installationSummary: p.installationSummary ?? "",
      warrantyId: p.warrantyId ?? "",
      status: p.status,
      priceType: p.priceType,
      priceValue: p.priceValue != null ? String(p.priceValue) : "",
      priceValueMax: p.priceValueMax != null ? String(p.priceValueMax) : "",
      priceVerificationDate: p.priceVerificationDate ? p.priceVerificationDate.slice(0, 10) : "",
      configuratorPrefillJson: p.configuratorPrefill != null ? JSON.stringify(p.configuratorPrefill, null, 2) : "",
    });
    setPkgFormError(null);
    setPkgFormErrors({});
    setShowPkgForm(true);
  }

  async function handleSavePkg() {
    setSaving(true);
    setPkgFormError(null);
    setPkgFormErrors({});

    let configuratorPrefill: unknown = null;
    if (pkgForm.configuratorPrefillJson.trim()) {
      try {
        configuratorPrefill = JSON.parse(pkgForm.configuratorPrefillJson);
      } catch {
        setPkgFormError("Configurator prefill isn't valid JSON.");
        setSaving(false);
        return;
      }
    }

    const payload = {
      slug: pkgForm.slug.trim(),
      name: pkgForm.name.trim(),
      targetCustomerDescription: pkgForm.targetCustomerDescription.trim() || null,
      category: pkgForm.category,
      images: cleanImages(pkgForm.images),
      cameraCount: num(pkgForm.cameraCount),
      cameraTypeSummary: pkgForm.cameraTypeSummary.trim() || null,
      recorderProductId: pkgForm.recorderProductId || null,
      storageSummary: pkgForm.storageSummary.trim() || null,
      networkingSummary: pkgForm.networkingSummary.trim() || null,
      cablingAssumptionText: pkgForm.cablingAssumptionText.trim() || null,
      powerSummary: pkgForm.powerSummary.trim() || null,
      installationSummary: pkgForm.installationSummary.trim() || null,
      warrantyId: pkgForm.warrantyId || null,
      status: pkgForm.status,
      priceType: pkgForm.priceType,
      priceValue: num(pkgForm.priceValue),
      priceValueMax: num(pkgForm.priceValueMax),
      priceVerificationDate: pkgForm.priceVerificationDate ? new Date(pkgForm.priceVerificationDate).toISOString() : null,
      configuratorPrefill,
    };
    try {
      if (editing) {
        await adminFetch(`/api/admin/packages/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        flash(`"${pkgForm.name}" updated.`);
      } else {
        await adminFetch("/api/admin/packages", { method: "POST", body: JSON.stringify(payload) });
        flash(`"${pkgForm.name}" created.`);
      }
      setShowPkgForm(false);
      await loadAll();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setPkgFormError(err.message);
        setPkgFormErrors(fieldErrors(err.details));
      } else {
        setPkgFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleArchivePkg() {
    if (!archiving) return;
    try {
      await adminFetch(`/api/admin/packages/${archiving.id}`, { method: "DELETE" });
      flash(`"${archiving.name}" archived.`);
      setArchiving(null);
      await loadAll();
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't archive package.");
      setArchiving(null);
    }
  }

  // --- Package items ---

  function openManageItems(p: Package) {
    setManagingItems(p);
    setItemForm(EMPTY_ITEM_FORM);
    setItemFormError(null);
  }

  async function refreshManagingItems() {
    if (!managingItems) return;
    const res = await adminFetch<{ packages: Package[] }>("/api/admin/packages");
    setPackages(res.packages);
    const updated = res.packages.find((p) => p.id === managingItems.id);
    if (updated) setManagingItems(updated);
  }

  async function handleAddItem() {
    if (!managingItems) return;
    setSavingItem(true);
    setItemFormError(null);
    const payload = {
      productId: itemForm.productId,
      quantity: Number(itemForm.quantity) || 1,
      requirement: itemForm.requirement,
      inclusionStatus: itemForm.inclusionStatus,
      priceOverride: num(itemForm.priceOverride),
      customerFacingDescription: itemForm.customerFacingDescription.trim() || null,
    };
    try {
      await adminFetch(`/api/admin/packages/${managingItems.id}/items`, { method: "POST", body: JSON.stringify(payload) });
      setItemForm(EMPTY_ITEM_FORM);
      await refreshManagingItems();
    } catch (err) {
      setItemFormError(err instanceof AdminApiError ? err.message : "Couldn't add item.");
    } finally {
      setSavingItem(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!managingItems) return;
    try {
      await adminFetch(`/api/admin/packages/${managingItems.id}/items/${itemId}`, { method: "DELETE" });
      await refreshManagingItems();
    } catch (err) {
      setItemFormError(err instanceof AdminApiError ? err.message : "Couldn't remove item.");
    }
  }

  async function handleMoveItem(itemId: string, direction: "up" | "down") {
    if (!managingItems) return;
    const ordered = [...managingItems.items].sort((a, b) => a.displayOrder - b.displayOrder).map((i) => i.id);
    const idx = ordered.indexOf(itemId);
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= ordered.length) return;
    [ordered[idx], ordered[swapWith]] = [ordered[swapWith], ordered[idx]];
    try {
      await adminFetch(`/api/admin/packages/${managingItems.id}/items/reorder`, {
        method: "POST",
        body: JSON.stringify({ orderedItemIds: ordered }),
      });
      await refreshManagingItems();
    } catch (err) {
      setItemFormError(err instanceof AdminApiError ? err.message : "Couldn't reorder items.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Packages"
        description="Bundled system packages made up of individual products."
        action={<Button onClick={openCreate}>+ New Package</Button>}
      />

      {successMessage && <SuccessBanner>{successMessage}</SuccessBanner>}
      {loadError && <ErrorBanner>{loadError}</ErrorBanner>}

      {packages === null ? (
        <Spinner />
      ) : (
        <Table columns={["Name", "Category", "Items", "Price Type", "Status", ""]}>
          {packages.length === 0 ? (
            <EmptyRow colSpan={6}>No packages yet.</EmptyRow>
          ) : (
            packages.map((p) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{p.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{p.category.replace(/_/g, " ")}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{p.items.length}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={p.priceType} />
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <Badge value={p.status} />
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => openManageItems(p)} style={{ background: "none", border: "none", color: colors.info, cursor: "pointer", fontSize: 13, marginRight: 12 }}>
                    Manage Items
                  </button>
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

      {showPkgForm && (
        <Modal title={editing ? `Edit: ${editing.name}` : "New Package"} onClose={() => setShowPkgForm(false)} wide>
          {pkgFormError && <ErrorBanner>{pkgFormError}</ErrorBanner>}
          <Field label="Name">
            <Input value={pkgForm.name} onChange={(v) => setPkgForm({ ...pkgForm, name: v })} error={pkgFormErrors.name} />
          </Field>
          <Field label="Slug">
            <Input value={pkgForm.slug} onChange={(v) => setPkgForm({ ...pkgForm, slug: v })} error={pkgFormErrors.slug} />
          </Field>
          <Field label="Target customer description">
            <Textarea value={pkgForm.targetCustomerDescription} onChange={(v) => setPkgForm({ ...pkgForm, targetCustomerDescription: v })} rows={2} />
          </Field>
          <Field label="Category">
            <Select value={pkgForm.category} onChange={(v) => setPkgForm({ ...pkgForm, category: v })} options={CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))} />
          </Field>
          <Field label="Status">
            <Select value={pkgForm.status} onChange={(v) => setPkgForm({ ...pkgForm, status: v })} options={STATUSES.map((s) => ({ value: s, label: s }))} />
          </Field>

          <div style={{ marginBottom: 14 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: colors.ink, marginBottom: 5 }}>
              Images
            </span>
            <p style={{ fontSize: 12, color: colors.slate, marginBottom: 8 }}>
              Upload an image directly, or paste a direct HTTPS image URL — both work the same way. The first image
              is used on the package card and as the main package photo; additional images appear as a gallery on
              the package page. Use the arrows to reorder.
            </p>
            {pkgForm.images.length === 0 && (
              <p style={{ fontSize: 12, color: colors.slateLight, marginBottom: 8 }}>No images added yet.</p>
            )}
            {pkgForm.images.map((img, i) => (
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
                    disabled={i === pkgForm.images.length - 1}
                    aria-label="Move image down"
                    style={{ background: "none", border: "none", cursor: i === pkgForm.images.length - 1 ? "default" : "pointer", color: i === pkgForm.images.length - 1 ? colors.slateLight : colors.slate, fontSize: 12, lineHeight: 1, padding: 2 }}
                  >
                    ▼
                  </button>
                </div>
                <div style={{ flex: 2 }}>
                  <Input
                    value={img.url}
                    onChange={(v) => {
                      const next = [...pkgForm.images];
                      next[i] = { ...next[i], url: v };
                      setPkgForm({ ...pkgForm, images: next });
                    }}
                    placeholder="https://…/image.jpg"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    value={img.alt ?? ""}
                    onChange={(v) => {
                      const next = [...pkgForm.images];
                      next[i] = { ...next[i], alt: v };
                      setPkgForm({ ...pkgForm, images: next });
                    }}
                    placeholder="Alt text (optional)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPkgForm({ ...pkgForm, images: pkgForm.images.filter((_, idx) => idx !== i) })}
                  aria-label="Remove image"
                  style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13, padding: "8px 4px" }}
                >
                  Remove
                </button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Button variant="secondary" onClick={() => setPkgForm({ ...pkgForm, images: [...pkgForm.images, { url: "", alt: "" }] })}>
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

          <hr style={{ border: "none", borderTop: `1px solid ${colors.border}`, margin: "16px 0" }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: colors.slate, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
            What&rsquo;s included (shown on the public package page)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Camera count">
              <Input type="number" value={pkgForm.cameraCount} onChange={(v) => setPkgForm({ ...pkgForm, cameraCount: v })} />
            </Field>
            <Field label="Camera type summary">
              <Input value={pkgForm.cameraTypeSummary} onChange={(v) => setPkgForm({ ...pkgForm, cameraTypeSummary: v })} placeholder="e.g. 4x 2MP outdoor bullet cameras" />
            </Field>
          </div>
          <Field label="Recorder (product)">
            <Select
              value={pkgForm.recorderProductId}
              onChange={(v) => setPkgForm({ ...pkgForm, recorderProductId: v })}
              placeholder="None"
              options={products.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>
          <Field label="Storage summary">
            <Input value={pkgForm.storageSummary} onChange={(v) => setPkgForm({ ...pkgForm, storageSummary: v })} placeholder="e.g. 1TB HDD, ~2 weeks retention" />
          </Field>
          <Field label="Networking summary">
            <Input value={pkgForm.networkingSummary} onChange={(v) => setPkgForm({ ...pkgForm, networkingSummary: v })} placeholder="e.g. 1x 8-port PoE switch included" />
          </Field>
          <Field label="Cabling assumption">
            <Input value={pkgForm.cablingAssumptionText} onChange={(v) => setPkgForm({ ...pkgForm, cablingAssumptionText: v })} placeholder="e.g. Up to 30m Cat6 run per camera" />
          </Field>
          <Field label="Power summary">
            <Input value={pkgForm.powerSummary} onChange={(v) => setPkgForm({ ...pkgForm, powerSummary: v })} placeholder="e.g. PoE — no separate power supply needed" />
          </Field>
          <Field label="Installation summary">
            <Input value={pkgForm.installationSummary} onChange={(v) => setPkgForm({ ...pkgForm, installationSummary: v })} placeholder="e.g. 1-day standard installation" />
          </Field>
          <Field label="Warranty">
            <Select
              value={pkgForm.warrantyId}
              onChange={(v) => setPkgForm({ ...pkgForm, warrantyId: v })}
              placeholder="None"
              options={warranties.map((w) => ({ value: w.id, label: w.name }))}
            />
          </Field>

          <hr style={{ border: "none", borderTop: `1px solid ${colors.border}`, margin: "16px 0" }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: colors.slate, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>Pricing</p>
          <Field label="Price type">
            <Select value={pkgForm.priceType} onChange={(v) => setPkgForm({ ...pkgForm, priceType: v })} options={PRICE_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Price">
              <Input type="number" value={pkgForm.priceValue} onChange={(v) => setPkgForm({ ...pkgForm, priceValue: v })} />
            </Field>
            <Field label="Price (max, for range)">
              <Input type="number" value={pkgForm.priceValueMax} onChange={(v) => setPkgForm({ ...pkgForm, priceValueMax: v })} />
            </Field>
          </div>
          <Field label="Price verified on">
            <Input type="date" value={pkgForm.priceVerificationDate} onChange={(v) => setPkgForm({ ...pkgForm, priceVerificationDate: v })} />
          </Field>
          <p style={{ fontSize: 11, color: colors.slateLight, marginTop: -8, marginBottom: 14 }}>
            Leave blank if this price hasn&rsquo;t been confirmed — the public site will show &ldquo;Request Quote&rdquo; instead of the price above until this is set.
          </p>

          <hr style={{ border: "none", borderTop: `1px solid ${colors.border}`, margin: "16px 0" }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: colors.slate, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
            Configurator prefill (optional)
          </p>
          <Field label="Prefill JSON">
            <Textarea
              value={pkgForm.configuratorPrefillJson}
              onChange={(v) => setPkgForm({ ...pkgForm, configuratorPrefillJson: v })}
              rows={4}
            />
          </Field>
          <p style={{ fontSize: 11, color: colors.slateLight, marginTop: -8, marginBottom: 14 }}>
            Powers the &ldquo;Configure This Package&rdquo; button on the public site — any subset of:{" "}
            propertyType, cameraCount, coverageTierId, storageTierId, floors, cableDistanceCategory, difficultAccess,
            needsConduitTrunking, isNewCabling, wantsRemoteViewSetup, optionalServiceIds. Leave blank to link to a
            blank Configurator instead.
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setShowPkgForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePkg} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create package"}
            </Button>
          </div>
        </Modal>
      )}

      {archiving && (
        <ConfirmDialog
          title="Archive package?"
          message={`"${archiving.name}" will be archived and hidden from the public site.`}
          confirmLabel="Archive"
          danger
          onConfirm={handleArchivePkg}
          onCancel={() => setArchiving(null)}
        />
      )}

      {managingItems && (
        <Modal title={`Items — ${managingItems.name}`} onClose={() => setManagingItems(null)} wide>
          {itemFormError && <ErrorBanner>{itemFormError}</ErrorBanner>}

          {managingItems.items.length === 0 ? (
            <p style={{ fontSize: 13, color: colors.slateLight, marginBottom: 16 }}>No items in this package yet.</p>
          ) : (
            <div style={{ marginBottom: 20 }}>
              {[...managingItems.items]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((item, idx, arr) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>
                        {productName(item.productId)} × {item.quantity}
                      </div>
                      <div style={{ fontSize: 12, color: colors.slate, marginTop: 2 }}>
                        {item.requirement} · {item.inclusionStatus.replace(/_/g, " ")}
                        {item.priceOverride != null ? ` · Override: ${item.priceOverride}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        onClick={() => handleMoveItem(item.id, "up")}
                        disabled={idx === 0}
                        style={{ background: "none", border: "none", cursor: idx === 0 ? "not-allowed" : "pointer", color: colors.slate, opacity: idx === 0 ? 0.4 : 1 }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveItem(item.id, "down")}
                        disabled={idx === arr.length - 1}
                        style={{ background: "none", border: "none", cursor: idx === arr.length - 1 ? "not-allowed" : "pointer", color: colors.slate, opacity: idx === arr.length - 1 ? 0.4 : 1 }}
                      >
                        ↓
                      </button>
                      <button onClick={() => handleRemoveItem(item.id)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <hr style={{ border: "none", borderTop: `1px solid ${colors.border}`, margin: "16px 0" }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: colors.slate, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>Add item</p>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, alignItems: "end" }}>
            <Field label="Product">
              <Select
                value={itemForm.productId}
                onChange={(v) => setItemForm({ ...itemForm, productId: v })}
                placeholder="Select product"
                options={products.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Field>
            <Field label="Quantity">
              <Input type="number" value={itemForm.quantity} onChange={(v) => setItemForm({ ...itemForm, quantity: v })} />
            </Field>
            <Field label="Requirement">
              <Select
                value={itemForm.requirement}
                onChange={(v) => setItemForm({ ...itemForm, requirement: v })}
                options={[
                  { value: "REQUIRED", label: "Required" },
                  { value: "OPTIONAL", label: "Optional" },
                ]}
              />
            </Field>
            <Field label="Inclusion">
              <Select
                value={itemForm.inclusionStatus}
                onChange={(v) => setItemForm({ ...itemForm, inclusionStatus: v })}
                options={[
                  { value: "INCLUDED", label: "Included" },
                  { value: "EXCLUDED", label: "Excluded" },
                  { value: "OPTIONAL_ADDON", label: "Optional add-on" },
                ]}
              />
            </Field>
          </div>
          <div style={{ marginTop: 10 }}>
            <Field label="Customer-facing description (optional)">
              <Input value={itemForm.customerFacingDescription} onChange={(v) => setItemForm({ ...itemForm, customerFacingDescription: v })} />
            </Field>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <Button onClick={handleAddItem} disabled={savingItem || !itemForm.productId}>
              {savingItem ? "Adding…" : "Add item"}
            </Button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setManagingItems(null)}>
              Done
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
