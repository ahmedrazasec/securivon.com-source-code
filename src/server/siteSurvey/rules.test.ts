import { describe, it, expect } from "vitest";
import { checkSiteSurveyRequired } from "@/server/siteSurvey/rules";
import type { SiteSurveyCheckInput } from "@/server/siteSurvey/rules";

function baseInput(overrides: Partial<SiteSurveyCheckInput> = {}): SiteSurveyCheckInput {
  return {
    propertyType: "house",
    cameraCount: 4,
    floors: 1,
    cableDistanceCategory: "short",
    difficultAccess: false,
    selectedServiceIds: [],
    hasVerifiedPricingForSelection: true,
    customerRequestedSurvey: false,
    ...overrides,
  };
}

describe("checkSiteSurveyRequired", () => {
  it("does not require a survey for a simple home configuration", () => {
    const result = checkSiteSurveyRequired(baseInput());
    expect(result.required).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it("requires a survey for warehouse/industrial property", () => {
    const result = checkSiteSurveyRequired(baseInput({ propertyType: "warehouse" }));
    expect(result.required).toBe(true);
    expect(result.reasons.join(" ")).toMatch(/warehouse/i);
  });

  it("requires a survey for large camera counts", () => {
    const result = checkSiteSurveyRequired(baseInput({ cameraCount: 20 }));
    expect(result.required).toBe(true);
  });

  it("requires a survey for multi-floor complexes", () => {
    const result = checkSiteSurveyRequired(baseInput({ floors: 4 }));
    expect(result.required).toBe(true);
  });

  it("requires a survey for long cable runs combined with difficult access", () => {
    const result = checkSiteSurveyRequired(
      baseInput({ cableDistanceCategory: "long", difficultAccess: true })
    );
    expect(result.required).toBe(true);
  });

  it("does NOT require a survey for a long cable run alone without difficult access", () => {
    const result = checkSiteSurveyRequired(baseInput({ cableDistanceCategory: "long", difficultAccess: false }));
    expect(result.required).toBe(false);
  });

  it("always requires a survey when fire alarm is selected, regardless of other answers", () => {
    const result = checkSiteSurveyRequired(baseInput({ selectedServiceIds: ["fire"] }));
    expect(result.required).toBe(true);
    expect(result.reasons.join(" ")).toMatch(/quote-only/i);
  });

  it("always requires a survey when intrusion is selected", () => {
    const result = checkSiteSurveyRequired(baseInput({ selectedServiceIds: ["intrusion"] }));
    expect(result.required).toBe(true);
  });

  it("requires a survey when pricing data is not verified for the selection", () => {
    const result = checkSiteSurveyRequired(baseInput({ hasVerifiedPricingForSelection: false }));
    expect(result.required).toBe(true);
  });

  it("requires a survey when the customer explicitly asks for one", () => {
    const result = checkSiteSurveyRequired(baseInput({ customerRequestedSurvey: true }));
    expect(result.required).toBe(true);
  });

  it("requires a survey for a property type outside the eligible allowlist, even with no other rule triggered", () => {
    const result = checkSiteSurveyRequired(baseInput({ propertyType: "other" }));
    expect(result.required).toBe(true);
  });

  it("does not require a survey for small shop/office/restaurant within normal limits", () => {
    for (const propertyType of ["shop", "office", "restaurant", "apartment"] as const) {
      const result = checkSiteSurveyRequired(baseInput({ propertyType }));
      expect(result.required).toBe(false);
    }
  });
});
