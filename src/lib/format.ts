/**
 * Client-safe formatting utilities.
 *
 * No "server-only" import here deliberately — this is used by both server
 * and client components (e.g. displaying an already-computed price).
 * Ported from the approved prototype's `formatPKR` helper.
 */
export function formatPKR(amount: number): string {
  return "Rs " + Math.round(amount).toLocaleString("en-PK");
}
