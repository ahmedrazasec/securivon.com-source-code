import "server-only";

/**
 * Quote immutability.
 *
 * Phase 2 Corrections §8 requires that a Quote, once created, is never
 * mutated — a price change later must not alter a historical quote. This
 * module is the structural enforcement point: there is deliberately no
 * `updateQuotePricing()` function anywhere in this codebase. The only way
 * to "change" a quote is `createRevision()`, which builds a brand-new quote
 * object linked via `revisedFromQuoteId` and leaves the original untouched.
 *
 * Kept dependency-free (no Prisma types) so the invariant itself — "revising
 * never touches the original" — can be unit-tested as pure logic. The
 * repository layer is responsible for actually persisting the result of
 * createRevision() as a new database row, never as an UPDATE to the
 * original row's pricing fields.
 */

export interface QuoteSnapshot {
  id: string;
  leadId: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED";
  totalEstimatedLow: number | null;
  totalEstimatedHigh: number | null;
  configurationSnapshot: Record<string, unknown>;
  pricingRulesSnapshot: Record<string, unknown>;
  revisedFromQuoteId: string | null;
  createdAt: string;
}

export function createRevision(
  original: QuoteSnapshot,
  newId: string,
  changes: Partial<
    Pick<
      QuoteSnapshot,
      | "totalEstimatedLow"
      | "totalEstimatedHigh"
      | "configurationSnapshot"
      | "pricingRulesSnapshot"
    >
  >
): QuoteSnapshot {
  return {
    id: newId,
    leadId: original.leadId,
    status: "DRAFT",
    totalEstimatedLow: changes.totalEstimatedLow ?? original.totalEstimatedLow,
    totalEstimatedHigh: changes.totalEstimatedHigh ?? original.totalEstimatedHigh,
    configurationSnapshot: changes.configurationSnapshot ?? original.configurationSnapshot,
    pricingRulesSnapshot: changes.pricingRulesSnapshot ?? original.pricingRulesSnapshot,
    revisedFromQuoteId: original.id,
    createdAt: new Date().toISOString(),
  };
}

/** Status transitions are the only mutation ever allowed on an existing quote row. */
const ALLOWED_STATUS_TRANSITIONS: Record<QuoteSnapshot["status"], QuoteSnapshot["status"][]> = {
  DRAFT: ["SENT", "EXPIRED"],
  SENT: ["ACCEPTED", "EXPIRED"],
  ACCEPTED: [],
  EXPIRED: [],
};

export function canTransitionStatus(
  from: QuoteSnapshot["status"],
  to: QuoteSnapshot["status"]
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}
