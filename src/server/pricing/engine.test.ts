import { describe, it, expect } from "vitest";
import { computeEstimate } from "@/server/pricing/engine";
import type { PricingEstimateInput, PricingRateSet } from "@/server/pricing/types";

function baseRates(): PricingRateSet {
  return {
    coverageTiers: [
      { id: "t1", tierId: "standard", ratePerCamera: 15000, verificationDate: "2026-01-01" },
      { id: "t2", tierId: "high", ratePerCamera: 22000, verificationDate: "2026-01-01" },
    ],
    recorderTiers: [
      { id: "r1", maxCameras: 4, price: 14000, verificationDate: "2026-01-01" },
      { id: "r2", maxCameras: 8, price: 22000, verificationDate: "2026-01-01" },
    ],
    cabling: { cableType: "CAT6", ratePerMeter: 100, includedAllowancePerCamera: 20 },
    installation: {
      serviceType: "CCTV",
      baseRatePerUnit: 3000,
      floorModifier: 2000,
      heightAccessModifier: 8000,
      conduitTrunkingModifier: 5000,
      existingVsNewCablingModifier: 4000,
      configurationFee: 3000,
      remoteViewSetupFee: 2000,
      minimumCharge: 5000,
    },
    storageUpgradeCost: 6000,
    addonCosts: {
      intercom: { cost: 15000, quoteOnly: false },
      fire: { cost: null, quoteOnly: true },
    },
    rounding: { granularity: 500, direction: "NEAREST" },
    minimumChargeAmount: 5000,
  };
}

function baseInput(overrides: Partial<PricingEstimateInput> = {}): PricingEstimateInput {
  return {
    coverageTierId: "standard",
    cameraCount: 4,
    storageTierId: "2w",
    addonIds: [],
    floors: 1,
    cableDistanceCategory: "medium",
    cableDistanceMetersPerCamera: { short: 10, medium: 25, long: 50 },
    difficultAccess: false,
    needsConduitTrunking: false,
    isNewCabling: true,
    wantsRemoteViewSetup: false,
    ...overrides,
  };
}

describe("computeEstimate", () => {
  it("produces an ESTIMATED result with a low/high range when rate data is complete", () => {
    const result = computeEstimate(baseInput(), baseRates());
    expect(result.priceType).toBe("ESTIMATED");
    expect(result.insufficientData).toBe(false);
    expect(result.low).not.toBeNull();
    expect(result.high).not.toBeNull();
    expect(result.low!).toBeLessThan(result.high!);
  });

  it("never invents a number when the coverage tier rate is missing", () => {
    const result = computeEstimate(baseInput({ coverageTierId: "unknown-tier" }), baseRates());
    expect(result.priceType).toBe("QUOTE_ONLY");
    expect(result.insufficientData).toBe(true);
    expect(result.low).toBeNull();
    expect(result.high).toBeNull();
    expect(result.insufficientDataReasons.length).toBeGreaterThan(0);
  });

  it("never invents a number when no recorder tier covers the camera count", () => {
    const result = computeEstimate(baseInput({ cameraCount: 999 }), baseRates());
    expect(result.priceType).toBe("QUOTE_ONLY");
    expect(result.insufficientData).toBe(true);
  });

  it("flags quote-only add-ons separately instead of pricing them", () => {
    const result = computeEstimate(baseInput({ addonIds: ["fire"] }), baseRates());
    expect(result.hasQuoteOnlyAddon).toBe(true);
    expect(result.quoteOnlyAddonIds).toContain("fire");
    // Fire is quote-only but everything else is priced — should still estimate the rest.
    expect(result.priceType).toBe("ESTIMATED");
  });

  it("applies the minimum installation charge when computed installation is below it", () => {
    const rates = baseRates();
    rates.installation.baseRatePerUnit = 100; // deliberately tiny
    rates.installation.minimumCharge = rates.minimumChargeAmount = 50000;
    const result = computeEstimate(baseInput({ cameraCount: 1 }), rates);
    expect(result.breakdown.installation).toBeGreaterThanOrEqual(50000);
  });

  it("applies an active percentage discount and does not apply an inactive one", () => {
    const rates = baseRates();
    const withDiscount = computeEstimate(
      baseInput(),
      { ...rates, discount: { id: "d1", type: "PERCENTAGE", value: 10, active: true, validFrom: null, validUntil: null } }
    );
    const withoutDiscount = computeEstimate(
      baseInput(),
      { ...rates, discount: { id: "d1", type: "PERCENTAGE", value: 10, active: false, validFrom: null, validUntil: null } }
    );
    expect(withDiscount.breakdown.discountApplied).toBeGreaterThan(0);
    expect(withoutDiscount.breakdown.discountApplied).toBe(0);
  });

  it("respects an expired discount's validUntil date", () => {
    const rates = baseRates();
    const result = computeEstimate(
      baseInput(),
      {
        ...rates,
        discount: {
          id: "d1",
          type: "PERCENTAGE",
          value: 10,
          active: true,
          validFrom: null,
          validUntil: "2020-01-01",
        },
      }
    );
    expect(result.breakdown.discountApplied).toBe(0);
  });

  it("applies tax only when the tax rule is active", () => {
    const rates = baseRates();
    const withTax = computeEstimate(baseInput(), {
      ...rates,
      tax: { ratePercentage: 17, appliesTo: "ALL", active: true },
    });
    const withoutTax = computeEstimate(baseInput(), {
      ...rates,
      tax: { ratePercentage: 17, appliesTo: "ALL", active: false },
    });
    expect(withTax.breakdown.taxApplied).toBeGreaterThan(0);
    expect(withoutTax.breakdown.taxApplied).toBe(0);
  });

  it("never produces a negative price from rounding", () => {
    const result = computeEstimate(baseInput(), baseRates());
    expect(result.low!).toBeGreaterThan(0);
  });
});
