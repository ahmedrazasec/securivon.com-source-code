import "server-only";
import type { PriceType } from "./types";

/**
 * Pricing-status enforcement.
 *
 * PricingStatus (VERIFIED / NEEDS_REVIEW / STALE — prisma/schema.prisma) is
 * a distinct concern from PriceType (FIXED / STARTING_FROM / RANGE /
 * ESTIMATED / QUOTE_ONLY). PriceType describes how a price should be
 * DISPLAYED; PricingStatus describes whether Admin currently trusts that
 * price enough to show it at all.
 *
 * This is the single place that rule is enforced: "the public calculator
 * must NEVER use NEEDS_REVIEW or STALE as verified pricing" (Stage 2 §10).
 * Every code path that decides what price to show a customer — the pricing
 * engine, product/package serializers, the configurator — must call
 * `resolveEffectivePriceType` (or `isPubliclyPriceable`) rather than reading
 * a stored PriceType directly, so this rule cannot be silently bypassed by
 * a new call site forgetting to check status.
 */

export type PricingStatusValue = "VERIFIED" | "NEEDS_REVIEW" | "STALE";

/**
 * Given the price type Admin has stored and the record's current pricing
 * status, returns the price type that's actually safe to show a customer.
 * A non-VERIFIED status always downgrades to QUOTE_ONLY, regardless of what
 * PriceType was configured — there is no override.
 */
export function resolveEffectivePriceType(
  storedPriceType: PriceType,
  pricingStatus: PricingStatusValue
): PriceType {
  if (pricingStatus !== "VERIFIED") return "QUOTE_ONLY";
  return storedPriceType;
}

export function isPubliclyPriceable(pricingStatus: PricingStatusValue): boolean {
  return pricingStatus === "VERIFIED";
}

/**
 * Computes pricing status from verification/review dates — used by Admin's
 * "stale price" surfacing (Phase 2 Section E / Phase 4 §7) rather than
 * requiring Admin staff to manually flag every record. Admin can still
 * manually set NEEDS_REVIEW at any time (e.g. after editing a rate); this
 * function only ever proposes STALE based on the review-due date, never
 * silently promotes something to VERIFIED — that transition must always be
 * an explicit Admin action.
 */
export function computeSuggestedPricingStatus(
  currentStatus: PricingStatusValue,
  priceReviewDueDate: Date | null,
  now: Date = new Date()
): PricingStatusValue {
  if (currentStatus !== "VERIFIED") return currentStatus; // never auto-change a non-verified status
  if (priceReviewDueDate && priceReviewDueDate.getTime() < now.getTime()) return "STALE";
  return currentStatus;
}
