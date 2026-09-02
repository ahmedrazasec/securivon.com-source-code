import { describe, expect, it } from "vitest";
import {
  buildBreakdownRows,
  hasDiscountLine,
  hasTaxLine,
  formatPkr,
  shouldShowSiteSurveyResult,
  type PricingBreakdown,
} from "./configuratorResult";

function fullBreakdown(overrides: Partial<PricingBreakdown> = {}): PricingBreakdown {
  return {
    hardware: 50000,
    accessories: 0,
    cabling: 8000,
    installation: 12000,
    configuration: 3000,
    delivery: 0,
    optionalUpgrades: 0,
    discountApplied: 0,
    taxApplied: 0,
    ...overrides,
  };
}

describe("buildBreakdownRows", () => {
  it("renders a normal estimated result's non-zero lines", () => {
    const rows = buildBreakdownRows(fullBreakdown());
    expect(rows.map((r) => r.key)).toEqual(["hardware", "cabling", "installation", "configuration"]);
    expect(rows.find((r) => r.key === "hardware")?.value).toBe(50000);
  });

  it("drops zero-value lines instead of showing empty/misleading rows", () => {
    const rows = buildBreakdownRows(fullBreakdown({ accessories: 0, delivery: 0, optionalUpgrades: 0 }));
    expect(rows.some((r) => r.key === "accessories")).toBe(false);
    expect(rows.some((r) => r.key === "delivery")).toBe(false);
    expect(rows.some((r) => r.key === "optionalUpgrades")).toBe(false);
  });

  it("produces no broken/empty UI when every breakdown value is missing/zero", () => {
    const rows = buildBreakdownRows(fullBreakdown({ hardware: 0, cabling: 0, installation: 0, configuration: 0 }));
    expect(rows).toEqual([]);
  });

  it("never surfaces a field outside the explicit allowlist, even if the object has extra keys", () => {
    // Simulates what would happen if PricingLineBreakdown ever grew an
    // internal-only field — this must NOT leak into the display rows.
    const breakdownWithExtraField = {
      ...fullBreakdown(),
      supplierCostInternal: 99999,
    } as PricingBreakdown & { supplierCostInternal: number };

    const rows = buildBreakdownRows(breakdownWithExtraField);
    expect(rows.some((r) => r.key === "supplierCostInternal")).toBe(false);
    expect(rows.every((r) => ["hardware", "cabling", "installation", "configuration"].includes(r.key))).toBe(true);
  });
});

describe("hasDiscountLine / hasTaxLine", () => {
  it("is false when the amount is zero or absent", () => {
    expect(hasDiscountLine(fullBreakdown())).toBe(false);
    expect(hasTaxLine(fullBreakdown())).toBe(false);
  });

  it("is true when a positive amount is present", () => {
    expect(hasDiscountLine(fullBreakdown({ discountApplied: 1500 }))).toBe(true);
    expect(hasTaxLine(fullBreakdown({ taxApplied: 4200 }))).toBe(true);
  });
});

describe("formatPkr", () => {
  it("formats with thousands separators and rounds", () => {
    expect(formatPkr(125000)).toBe("Rs. 125,000");
    expect(formatPkr(1999.6)).toBe("Rs. 2,000");
  });
});

describe("shouldShowSiteSurveyResult", () => {
  it("shows the estimate for a normal estimated result", () => {
    expect(
      shouldShowSiteSurveyResult({ siteSurveyRequired: false, estimate: { insufficientData: false } })
    ).toBe(false);
  });

  it("shows the site-survey state when siteSurveyRequired is true (quote-only path)", () => {
    expect(
      shouldShowSiteSurveyResult({ siteSurveyRequired: true, estimate: null })
    ).toBe(true);
  });

  it("shows the site-survey state when estimate is missing", () => {
    expect(shouldShowSiteSurveyResult({ siteSurveyRequired: false, estimate: null })).toBe(true);
  });

  it("shows the site-survey state when the engine flags insufficientData, even if siteSurveyRequired is false", () => {
    expect(
      shouldShowSiteSurveyResult({ siteSurveyRequired: false, estimate: { insufficientData: true } })
    ).toBe(true);
  });
});
