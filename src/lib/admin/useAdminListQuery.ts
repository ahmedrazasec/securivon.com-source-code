"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin/adminApi";

/**
 * Shared data layer for Admin list views (Leads, Quotes, Site Surveys).
 * Mostly read-only — there's no create/delete here, since these sections
 * only ever display data written by the public submission flow
 * (src/server/publicRoutes/leads.ts) — but as of Batch 3, `updateStatus`
 * is one narrow, explicit write path each page can opt into.
 */
export function useAdminListQuery<TListItem extends { id: string; status: string }, TDetail extends { status: string } = TListItem>(
  options: {
    listUrl: string;
    listKey: string;
    itemUrl: (id: string) => string;
    itemKey: string;
    status?: string;
  }
) {
  const { listUrl, listKey, itemUrl, itemKey, status } = options;

  const [items, setItems] = useState<TListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [detail, setDetail] = useState<TDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const url = status ? `${listUrl}?status=${encodeURIComponent(status)}` : listUrl;
    try {
      const res = await adminFetch<Record<string, TListItem[]>>(url);
      setItems(res[listKey]);
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Couldn't load data.");
    }
  }, [listUrl, listKey, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern, same precedent as ProductsPage
    load();
  }, [load]);

  const loadDetail = useCallback(
    async (id: string) => {
      setDetail(null);
      setDetailError(null);
      setDetailLoading(true);
      try {
        const res = await adminFetch<Record<string, TDetail>>(itemUrl(id));
        setDetail(res[itemKey]);
      } catch (err) {
        setDetailError(err instanceof AdminApiError ? err.message : "Couldn't load details.");
      } finally {
        setDetailLoading(false);
      }
    },
    [itemUrl, itemKey]
  );

  const clearDetail = useCallback(() => {
    setDetail(null);
    setDetailError(null);
  }, []);

  /**
   * PATCHes {status} to itemUrl(id). On success, reflects the new status
   * both in the open detail view and in the already-loaded list — without
   * a full reload — by merging the server's returned record (the source
   * of truth for the new `updatedAt`, etc.) over the matching list item.
   * Returns true/false so the caller can decide what to do next (e.g.
   * close a dropdown) without needing to inspect updateError itself.
   */
  const updateStatus = useCallback(
    async (id: string, newStatus: string): Promise<boolean> => {
      setUpdateError(null);
      setUpdating(true);
      try {
        const res = await adminFetch<Record<string, TDetail>>(itemUrl(id), {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        });
        const updated = res[itemKey];
        setDetail(updated);
        setItems((prev) => prev?.map((item) => (item.id === id ? { ...item, status: updated.status } : item)) ?? prev);
        return true;
      } catch (err) {
        setUpdateError(err instanceof AdminApiError ? err.message : "Couldn't update status.");
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [itemUrl, itemKey]
  );

  return { items, loadError, reload: load, detail, detailLoading, detailError, loadDetail, clearDetail, updateStatus, updating, updateError };
}
