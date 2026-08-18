import { describe, it, expect } from "vitest";
import {
  resolveEffectivePriceType,
  isPubliclyPriceable,
  computeSuggestedPricingStatus,
} from "@/server/pricing/pricingStatus";

describe("resolveEffectivePriceType", () => {
  it("returns the stored price type when status is VERIFIED", () => {
    expect(resolveEffectivePriceType("STARTING_FROM", "VERIFIED")).toBe("STARTING_FROM");
    expect(resolveEffectivePriceType("FIXED", "VERIFIED")).toBe("FIXED");
    expect(resolveEffectivePriceType("RANGE", "VERIFIED")).toBe("RANGE");
  });

  it("forces QUOTE_ONLY when status is NEEDS_REVIEW, regardless of stored type", () => {
    expect(resolveEffectivePriceType("FIXED", "NEEDS_REVIEW")).toBe("QUOTE_ONLY");
    expect(resolveEffectivePriceType("STARTING_FROM", "NEEDS_REVIEW")).toBe("QUOTE_ONLY");
  });

  it("forces QUOTE_ONLY when status is STALE, regardless of stored type", () => {
    expect(resolveEffectivePriceType("FIXED", "STALE")).toBe("QUOTE_ONLY");
    expect(resolveEffectivePriceType("RANGE", "STALE")).toBe("QUOTE_ONLY");
  });

  it("has no override path — every non-VERIFIED status downgrades identically", () => {
    const statuses: Array<"NEEDS_REVIEW" | "STALE"> = ["NEEDS_REVIEW", "STALE"];
    for (const status of statuses) {
      for (const priceType of ["FIXED", "STARTING_FROM", "RANGE", "ESTIMATED"] as const) {
        expect(resolveEffectivePriceType(priceType, status)).toBe("QUOTE_ONLY");
      }
    }
  });
});

describe("isPubliclyPriceable", () => {
  it("is true only for VERIFIED", () => {
    expect(isPubliclyPriceable("VERIFIED")).toBe(true);
    expect(isPubliclyPriceable("NEEDS_REVIEW")).toBe(false);
    expect(isPubliclyPriceable("STALE")).toBe(false);
  });
});

describe("computeSuggestedPricingStatus", () => {
  it("suggests STALE once past the review-due date", () => {
    const result = computeSuggestedPricingStatus(
      "VERIFIED",
      new Date("2026-01-01"),
      new Date("2026-06-01")
    );
    expect(result).toBe("STALE");
  });

  it("keeps VERIFIED before the review-due date", () => {
    const result = computeSuggestedPricingStatus(
      "VERIFIED",
      new Date("2026-12-01"),
      new Date("2026-06-01")
    );
    expect(result).toBe("VERIFIED");
  });

  it("never auto-promotes NEEDS_REVIEW to VERIFIED", () => {
    const result = computeSuggestedPricingStatus(
      "NEEDS_REVIEW",
      new Date("2020-01-01"), // long past due — should NOT matter
      new Date("2026-06-01")
    );
    expect(result).toBe("NEEDS_REVIEW");
  });

  it("never auto-promotes STALE to VERIFIED", () => {
    const result = computeSuggestedPricingStatus("STALE", null, new Date("2026-06-01"));
    expect(result).toBe("STALE");
  });

  it("keeps VERIFIED when there is no review-due date set", () => {
    const result = computeSuggestedPricingStatus("VERIFIED", null, new Date("2026-06-01"));
    expect(result).toBe("VERIFIED");
  });
});
