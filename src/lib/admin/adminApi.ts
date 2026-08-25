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

export function fieldErrors(details: unknown): Record<string, string> {
  const flat = details as { fieldErrors?: Record<string, string[]> } | undefined;
  if (!flat?.fieldErrors) return {};
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    if (messages?.length) out[key] = messages[0];
  }
  return out;
}
