"use client";

import { useEffect, useState } from "react";
import { adminFetch, AdminApiError, fieldErrors } from "@/lib/admin/adminApi";
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

interface Package {
  id: string;
  slug: string;
  name: string;
  targetCustomerDescription: string | null;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  priceType: string;
  priceValue: number | null;
  priceValueMax: number | null;
  items: PackageItem[];
}

interface Product {
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
  status: string;
  priceType: string;
  priceValue: string;
  priceValueMax: string;
};
const EMPTY_PKG_FORM: PkgFormState = {
  slug: "",
  name: "",
  targetCustomerDescription: "",
  category: "HOME_STARTER",
  status: "DRAFT",
  priceType: "QUOTE_ONLY",
  priceValue: "",
  priceValueMax: "",
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

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editing, setEditing] = useState<Package | null>(null);
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [pkgForm, setPkgForm] = useState<PkgFormState>(EMPTY_PKG_FORM);
  const [pkgFormError, setPkgFormError] = useState<string | null>(null);
  const [pkgFormErrors, setPkgFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState<Package | null>(null);

  const [managingItems, setManagingItems] = useState<Package | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [itemFormError, setItemFormError] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  async function loadAll() {
    setLoadError(null);
    try {
      const [pkgRes, prodRes] = await Promise.all([
        adminFetch<{ packages: Package[] }>("/api/admin/packages"),
        adminFetch<{ products: Product[] }>("/api/admin/products"),
      ]);
      setPackages(pkgRes.packages);
      setProducts(prodRes.products);
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
      status: p.status,
      priceType: p.priceType,
      priceValue: p.priceValue != null ? String(p.priceValue) : "",
      priceValueMax: p.priceValueMax != null ? String(p.priceValueMax) : "",
    });
    setPkgFormError(null);
    setPkgFormErrors({});
    setShowPkgForm(true);
  }

  async function handleSavePkg() {
    setSaving(true);
    setPkgFormError(null);
    setPkgFormErrors({});
    const payload = {
      slug: pkgForm.slug.trim(),
      name: pkgForm.name.trim(),
      targetCustomerDescription: pkgForm.targetCustomerDescription.trim() || null,
      category: pkgForm.category,
      status: pkgForm.status,
      priceType: pkgForm.priceType,
      priceValue: num(pkgForm.priceValue),
      priceValueMax: num(pkgForm.priceValueMax),
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
        <Modal title={editing ? `Edit: ${editing.name}` : "New Package"} onClose={() => setShowPkgForm(false)}>
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
          <Field label="Price type">
            <Select value={pkgForm.priceType} onChange={(v) => setPkgForm({ ...pkgForm, priceType: v })} options={PRICE_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))} />
          </Field>
          <Field label="Price">
            <Input type="number" value={pkgForm.priceValue} onChange={(v) => setPkgForm({ ...pkgForm, priceValue: v })} />
          </Field>
          <Field label="Price (max, for range)">
            <Input type="number" value={pkgForm.priceValueMax} onChange={(v) => setPkgForm({ ...pkgForm, priceValueMax: v })} />
          </Field>
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
