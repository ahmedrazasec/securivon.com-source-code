import "server-only";
import type { NextRequest } from "next/server";

/**
 * Best-effort client IP extraction from standard reverse-proxy headers.
 * Used only for the admin-login rate limiter (loginRateLimit.ts) — not a
 * security-critical identity check on its own, just one of two signals
 * used to decide whether to slow down repeated login attempts.
 *
 * `x-forwarded-for` can contain a comma-separated chain (client, proxy1,
 * proxy2, ...) — the first entry is the original client as seen by the
 * nearest trusted proxy. Falls back to `x-real-ip`, then a fixed
 * "unknown" bucket if neither header is present (e.g. local dev without a
 * proxy in front) — every unidentified request then shares one rate-limit
 * bucket rather than being unlimited, which is the safer default.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
