"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch, AdminApiError, fieldErrors } from "@/lib/admin/adminApi";

/**
 * Shared data layer for simple Admin CRUD sections (Category, Brand,
 * Warranty — same list/create/update/deactivate shape server-side, per
 * src/server/adminRoutes/catalogueSupport.ts). Each page still writes its
 * own form UI, since the fields genuinely differ, but the fetch/loading/
 * error/success state is identical across all three, so it lives here once.
 */
export function useSimpleEntityCrud<T extends { id: string }>(options: {
  listUrl: string;
  listKey: string;
  itemUrl: (id: string) => string;
  itemKey: string;
}) {
  const { listUrl, listKey, itemUrl, itemKey } = options;

  const [items, setItems] = useState<T[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await adminFetch<Record<string, T[]>>(listUrl);
      setItems(res[listKey]);
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't load data.");
    }
  }, [listUrl, listKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern, same precedent as ProductsPage
    load();
  }, [load]);

  function flash(message: string) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  async function create(payload: unknown, label: string): Promise<boolean> {
    setSaving(true);
    setFormError(null);
    setFormErrors({});
    try {
      await adminFetch(listUrl, { method: "POST", body: JSON.stringify(payload) });
      flash(`"${label}" created.`);
      await load();
      return true;
    } catch (err) {
      if (err instanceof AdminApiError) {
        setFormError(err.message);
        setFormErrors(fieldErrors(err.details));
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, payload: unknown, label: string): Promise<boolean> {
    setSaving(true);
    setFormError(null);
    setFormErrors({});
    try {
      await adminFetch(itemUrl(id), { method: "PATCH", body: JSON.stringify(payload) });
      flash(`"${label}" updated.`);
      await load();
      return true;
    } catch (err) {
      if (err instanceof AdminApiError) {
        setFormError(err.message);
        setFormErrors(fieldErrors(err.details));
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string, label: string): Promise<boolean> {
    try {
      await adminFetch(itemUrl(id), { method: "DELETE" });
      flash(`"${label}" deactivated.`);
      await load();
      return true;
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : `Couldn't deactivate ${itemKey}.`);
      return false;
    }
  }

  return { items, loadError, successMessage, saving, formError, formErrors, create, update, deactivate };
}
