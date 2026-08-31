import "server-only";
import { canTransitionStatus } from "@/server/quotes/immutability";
import type { QuoteRepository, QuoteListRecord, QuoteDetailRecord } from "@/server/repositories/types";

/**
 * Pure Quote status-update logic (Batch 3) — deliberately has NO import of
 * src/server/container.ts, matching src/server/crm/leadStatus.ts and
 * src/server/quotes/immutability.ts's own dependency-free design.
 *
 * Never mutates pricing/snapshots — only status, and only along the
 * transitions canTransitionStatus() already defines (DRAFT→SENT/EXPIRED,
 * SENT→ACCEPTED/EXPIRED, ACCEPTED/EXPIRED→nothing). That pure function was
 * written in a prior batch but never wired into anything until now; this
 * is where it's enforced, not re-implemented.
 */

export type QuoteStatusUpdateResult =
  | { ok: true; quote: QuoteDetailRecord }
  | { ok: false; reason: "NOT_FOUND" }
  | { ok: false; reason: "INVALID_TRANSITION"; from: QuoteListRecord["status"]; to: QuoteListRecord["status"] };

export async function updateQuoteStatusCore(
  id: string,
  status: QuoteListRecord["status"],
  repository: Pick<QuoteRepository, "findById" | "updateStatus">
): Promise<QuoteStatusUpdateResult> {
  const existing = await repository.findById(id);
  if (!existing) return { ok: false, reason: "NOT_FOUND" };

  if (!canTransitionStatus(existing.status, status)) {
    return { ok: false, reason: "INVALID_TRANSITION", from: existing.status, to: status };
  }

  const quote = await repository.updateStatus(id, status);
  if (!quote) return { ok: false, reason: "NOT_FOUND" };
  return { ok: true, quote };
}
