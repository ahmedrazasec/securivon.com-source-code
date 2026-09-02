/**
 * Pure presentation-mapping helpers for the Configurator result screen
 * (src/app/(public)/configurator/ConfiguratorClient.tsx's QuoteResult).
 *
 * Deliberately pure and framework-free — no React, no DOM — so this can be
 * unit-tested the same way the rest of this codebase tests business logic
 * (pure functions against plain fixtures), without adding a DOM-testing
 * dependency (@testing-library/react + jsdom) just for one component.
 *
 * IMPORTANT: this module only ever reads the customer-facing
 * PricingLineBreakdown shape (hardware/accessories/cabling/installation/
 * configuration/delivery/optionalUpgrades/discountApplied/taxApplied) that
 * src/server/pricing/engine.ts already returns and
 * src/server/publicRoutes/configurator.ts already sends to the browser.
 * BREAKDOWN_FIELDS below is an explicit allowlist of exactly those fields —
 * the same allowlist-at-the-boundary pattern used by
 * toPublicProduct/toPublicService — so if PricingLineBreakdown ever gains an
 * internal-only field in the future, it will NOT silently start appearing
 * on the result screen just because it exists on the object.
 */

export interface PricingBreakdown {
  hardware: number;
  accessories: number;
  cabling: number;
  installation: number;
  configuration: number;
  delivery: number;
  optionalUpgrades: number;
  discountApplied: number;
  taxApplied: number;
}

const BREAKDOWN_FIELDS: { key: keyof PricingBreakdown; label: string }[] = [
  { key: "hardware", label: "Cameras & recorder" },
  { key: "accessories", label: "Accessories" },
  { key: "cabling", label: "Cabling" },
  { key: "installation", label: "Installation" },
  { key: "configuration", label: "Configuration & setup" },
  { key: "optionalUpgrades", label: "Optional add-ons" },
  { key: "delivery", label: "Delivery" },
];

export interface BreakdownRow {
  key: string;
  label: string;
  value: number;
}

/**
 * Maps a PricingLineBreakdown into display rows — only the known-safe,
 * allowlisted line items, and only ones with a positive value (a zero line
 * like "Accessories: Rs. 0" isn't misleading, but it's also not useful to a
 * customer, so it's dropped rather than shown as clutter).
 */
export function buildBreakdownRows(breakdown: PricingBreakdown): BreakdownRow[] {
  return BREAKDOWN_FIELDS.filter(({ key }) => breakdown[key] > 0).map(({ key, label }) => ({
    key,
    label,
    value: breakdown[key],
  }));
}

export function hasDiscountLine(breakdown: PricingBreakdown): boolean {
  return breakdown.discountApplied > 0;
}

export function hasTaxLine(breakdown: PricingBreakdown): boolean {
  return breakdown.taxApplied > 0;
}

/** Formats a PKR amount for display — rounds (breakdown values can carry float remainders from rate math) and adds thousands separators. Never fabricates a currency conversion or symbol beyond the site's existing "PKR"/"Rs." convention. */
export function formatPkr(n: number): string {
  return `Rs. ${Math.round(n).toLocaleString()}`;
}

/**
 * True when the result screen should show the "site survey recommended"
 * state instead of an estimate — mirrors the exact same condition the
 * public API/engine already encodes (siteSurveyRequired, missing estimate,
 * or engine-flagged insufficientData), so this file never invents its own
 * notion of when pricing is "good enough" to show.
 */
export function shouldShowSiteSurveyResult(result: {
  siteSurveyRequired: boolean;
  estimate: { insufficientData: boolean } | null;
}): boolean {
  return result.siteSurveyRequired || !result.estimate || result.estimate.insufficientData;
}
