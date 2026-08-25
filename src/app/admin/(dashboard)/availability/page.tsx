"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin/adminApi";
import { PageHeader, Input, Select, Table, EmptyRow, ErrorBanner, SuccessBanner, Spinner, colors } from "@/components/admin/ui";

interface Product {
  id: string;
  name: string;
  categoryId: string;
  availability: string;
  verificationDate: string | null;
}

interface Category {
  id: string;
  name: string;
}

const AVAILABILITIES = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "ORDER_REQUIRED", "DISCONTINUED", "UNKNOWN"];

function formatDate(iso: string | null) {
  if (!iso) return "Never verified";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * This page is a focused view over Product.availability — not a separate
 * data source (see the original placeholder's own note, now real). It
 * reuses the already-verified Products API with partial PATCH updates so
 * flipping one product's stock status doesn't require opening the full
 * ~20-field product form.
 */
export default function AvailabilityPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadAll() {
    setLoadError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        adminFetch<{ products: Product[] }>("/api/admin/products"),
        adminFetch<{ categories: Category[] }>("/api/admin/categories"),
      ]);
      setProducts(productsRes.products);
      setCategories(categoriesRes.categories);
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't load availability data.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern, same precedent as ProductsPage
    loadAll();
  }, []);

  function categoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? "—";
  }

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesAvailability = !availabilityFilter || p.availability === availabilityFilter;
      return matchesSearch && matchesAvailability;
    });
  }, [products, search, availabilityFilter]);

  function flash(message: string) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  async function updateAvailability(product: Product, availability: string) {
    setSavingId(product.id);
    try {
      await adminFetch(`/api/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ availability }) });
      setProducts((prev) => prev?.map((p) => (p.id === product.id ? { ...p, availability } : p)) ?? null);
      flash(`${product.name} updated.`);
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't update availability.");
    } finally {
      setSavingId(null);
    }
  }

  async function markVerifiedToday(product: Product) {
    setSavingId(product.id);
    const today = new Date().toISOString();
    try {
      await adminFetch(`/api/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ verificationDate: today }) });
      setProducts((prev) => prev?.map((p) => (p.id === product.id ? { ...p, verificationDate: today } : p)) ?? null);
      flash(`${product.name} marked verified today.`);
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't update verification date.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Availability"
        description="Quick view and update of product stock status across the catalogue. Public pages only ever show availability status — never raw supplier stock quantities or lead-time details."
      />

      {successMessage && <SuccessBanner>{successMessage}</SuccessBanner>}
      {loadError && <ErrorBanner>{loadError}</ErrorBanner>}

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ maxWidth: 260, flex: 1 }}>
          <Input value={search} onChange={setSearch} placeholder="Search products…" />
        </div>
        <div style={{ width: 200 }}>
          <Select
            value={availabilityFilter}
            onChange={setAvailabilityFilter}
            placeholder="All availability"
            options={AVAILABILITIES.map((a) => ({ value: a, label: a.replace(/_/g, " ") }))}
          />
        </div>
      </div>

      {products === null ? (
        <Spinner />
      ) : (
        <Table columns={["Product", "Category", "Availability", "Last Verified", ""]}>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={5}>{products.length === 0 ? "No products yet." : "No products match your filters."}</EmptyRow>
          ) : (
            filtered.map((p) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.ink }}>{p.name}</td>
                <td style={{ padding: "10px 14px", color: colors.slate }}>{categoryName(p.categoryId)}</td>
                <td style={{ padding: "10px 14px", width: 180 }}>
                  <select
                    value={p.availability}
                    disabled={savingId === p.id}
                    onChange={(e) => updateAvailability(p, e.target.value)}
                    style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${colors.border}`, fontSize: 12, color: colors.ink, background: "#fff" }}
                  >
                    {AVAILABILITIES.map((a) => (
                      <option key={a} value={a}>
                        {a.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "10px 14px", color: p.verificationDate ? colors.slate : colors.slateLight, fontSize: 12 }}>{formatDate(p.verificationDate)}</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <button
                    onClick={() => markVerifiedToday(p)}
                    disabled={savingId === p.id}
                    style={{ background: "none", border: "none", color: colors.info, cursor: savingId === p.id ? "wait" : "pointer", fontSize: 13 }}
                  >
                    Mark verified today
                  </button>
                </td>
              </tr>
            ))
          )}
        </Table>
      )}
    </div>
  );
}
