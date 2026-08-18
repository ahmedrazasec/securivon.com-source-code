import "server-only";
import type { PricingAuditLogCreateInput } from "./types";

/**
 * Pricing-change audit diffing.
 *
 * Pure function, no repository/DB dependency — computes which
 * PricingAuditLog entries should be written for a given before/after pair,
 * given an explicit list of fields that count as "pricing-relevant" for
 * that entity type. Kept separate from the repository layer so this logic
 * (which fields matter, how values are stringified) is unit-testable
 * without a database, and so a new caller can't accidentally log the wrong
 * fields or skip logging by forgetting to call the repository directly.
 */

const PRODUCT_PRICING_FIELDS = [
  "customerPriceType",
  "customerPriceValue",
  "customerPriceValueMax",
  "installationPriceType",
  "installationPriceValue",
  "installationPriceValueMax",
  "pricingStatus",
  "availability",
] as const;

const INSTALLATION_RATE_PRICING_FIELDS = [
  "baseRatePerUnit",
  "floorModifier",
  "heightAccessModifier",
  "conduitTrunkingModifier",
  "existingVsNewCablingModifier",
  "configurationFee",
  "remoteViewSetupFee",
  "minimumCharge",
] as const;

const PACKAGE_PRICING_FIELDS = ["priceType", "priceValue", "priceValueMax", "status"] as const;

const PRICING_RELEVANT_FIELDS: Record<string, readonly string[]> = {
  Product: PRODUCT_PRICING_FIELDS,
  InstallationRate: INSTALLATION_RATE_PRICING_FIELDS,
  Package: PACKAGE_PRICING_FIELDS,
};

function stringify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getField<T extends object>(obj: T, key: string): unknown {
  return (obj as Record<string, unknown>)[key];
}

/**
 * Compares `before` and `after` records for the given entity type and
 * returns one PricingAuditLogCreateInput per changed, pricing-relevant
 * field. Returns an empty array if nothing pricing-relevant changed (e.g.
 * only `shortDescription` was edited) — non-pricing content edits should
 * NOT create audit log noise, per the instruction to log "important pricing
 * changes," not every edit.
 *
 * Generic over `T` (rather than requiring `Record<string, unknown>`
 * directly) so callers can pass concrete repository record types
 * (ProductRecord, PackageRecord, etc.) without an unsafe cast — those
 * interfaces intentionally don't declare index signatures, since doing so
 * would weaken type-checking on every other use of those types elsewhere
 * in the codebase.
 */
export function diffPricingFields<T extends object>(
  entityType: keyof typeof PRICING_RELEVANT_FIELDS,
  entityId: string,
  adminUserId: string,
  action: PricingAuditLogCreateInput["action"],
  before: T | null,
  after: T
): PricingAuditLogCreateInput[] {
  const fields = PRICING_RELEVANT_FIELDS[entityType];
  const entries: PricingAuditLogCreateInput[] = [];

  for (const field of fields) {
    const oldValue = before ? stringify(getField(before, field)) : null;
    const newValue = stringify(getField(after, field));
    if (oldValue === newValue) continue; // no change on this field — skip

    entries.push({
      adminUserId,
      action,
      entityType,
      entityId,
      fieldChanged: field,
      oldValue,
      newValue,
    });
  }

  return entries;
}
