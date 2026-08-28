"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin/adminApi";

/**
 * Shared data layer for READ-ONLY Admin list views (Leads, Quotes, Site
 * Surveys). Unlike useSimpleEntityCrud, there's no create/update/deactivate
 * here — these sections only ever display data written by the public
 * submission flow (src/server/publicRoutes/leads.ts). Supports an optional
 * server-side status filter and a separate on-demand detail fetch for a
 * "view details" modal.
 */
export function useAdminListQuery<TListItem, TDetail = TListItem>(options: {
  listUrl: string;
  listKey: string;
  itemUrl: (id: string) => string;
  itemKey: string;
  status?: string;
}) {
  const { listUrl, listKey, itemUrl, itemKey, status } = options;

  const [items, setItems] = useState<TListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [detail, setDetail] = useState<TDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

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

  return { items, loadError, reload: load, detail, detailLoading, detailError, loadDetail, clearDetail };
}
