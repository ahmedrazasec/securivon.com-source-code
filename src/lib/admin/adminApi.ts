"use client";

/**
 * Thin fetch wrapper for Admin API calls from client components.
 *
 * On 401 (session expired/missing), redirects to /admin/login rather than
 * showing a confusing error — every Admin page should get this behavior
 * for free by using this instead of raw fetch().
 */
export class AdminApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (res.status === 401) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- this is a plain utility module, not a component, so useRouter()/redirect() aren't available here; a full page reload is also the correct behavior on session expiry (clears all client state, not just the route)
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new AdminApiError("Session expired.", 401);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new AdminApiError(body?.error ?? `Request failed (${res.status}).`, res.status, body?.details);
  }

  return body as T;
}

/**
 * Uploads a single catalogue image file to /api/admin/upload and returns
 * its public URL. Deliberately separate from adminFetch() rather than a
 * shared core with a "skip JSON header" flag: adminFetch always sends
 * Content-Type: application/json, which is wrong for a multipart upload —
 * the browser needs to set its own multipart boundary header, so this
 * function must NOT set Content-Type at all. Shares the same 401→login
 * redirect and error-shape behavior as adminFetch so upload failures look
 * and behave consistently with every other admin action.
 */
export async function adminUploadImage(entityType: "product" | "package" | "guide", file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("entityType", entityType);

  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });

  if (res.status === 401) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- see adminFetch above
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new AdminApiError("Session expired.", 401);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new AdminApiError(body?.error ?? `Upload failed (${res.status}).`, res.status, body?.details);
  }

  return body as { url: string };
}

export function fieldErrors(details: unknown): Record<string, string> {
  const flat = details as { fieldErrors?: Record<string, string[]> } | undefined;
  if (!flat?.fieldErrors) return {};
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    if (messages?.length) out[key] = messages[0];
  }
  return out;
}
