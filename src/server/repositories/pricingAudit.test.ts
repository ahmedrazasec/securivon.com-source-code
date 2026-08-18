import { describe, it, expect } from "vitest";
import { diffPricingFields } from "@/server/repositories/pricingAudit";

describe("diffPricingFields", () => {
  it("creates an audit entry for a changed pricing field", () => {
    const entries = diffPricingFields(
      "Product",
      "prod-1",
      "admin-1",
      "UPDATE",
      { customerPriceValue: 10000, pricingStatus: "VERIFIED" },
      { customerPriceValue: 12000, pricingStatus: "VERIFIED" }
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].fieldChanged).toBe("customerPriceValue");
    expect(entries[0].oldValue).toBe("10000");
    expect(entries[0].newValue).toBe("12000");
  });

  it("creates no entries when nothing pricing-relevant changed", () => {
    const entries = diffPricingFields(
      "Product",
      "prod-1",
      "admin-1",
      "UPDATE",
      { customerPriceValue: 10000, shortDescription: "old text" },
      { customerPriceValue: 10000, shortDescription: "new text" }
    );
    expect(entries).toHaveLength(0);
  });

  it("creates one entry per changed field when multiple pricing fields change", () => {
    const entries = diffPricingFields(
      "Product",
      "prod-1",
      "admin-1",
      "UPDATE",
      { customerPriceValue: 10000, availability: "IN_STOCK" },
      { customerPriceValue: 12000, availability: "OUT_OF_STOCK" }
    );
    expect(entries.map((e) => e.fieldChanged).sort()).toEqual(["availability", "customerPriceValue"]);
  });

  it("treats a null 'before' as a full CREATE diff against every set field", () => {
    const entries = diffPricingFields(
      "InstallationRate",
      "rate-1",
      "admin-1",
      "CREATE",
      null,
      { baseRatePerUnit: 3000, minimumCharge: 5000 }
    );
    expect(entries.every((e) => e.oldValue === null)).toBe(true);
    expect(entries.some((e) => e.fieldChanged === "baseRatePerUnit" && e.newValue === "3000")).toBe(true);
  });

  it("logs a pricingStatus change even when the price value itself is unchanged", () => {
    const entries = diffPricingFields(
      "Product",
      "prod-1",
      "admin-1",
      "UPDATE",
      { customerPriceValue: 10000, pricingStatus: "NEEDS_REVIEW" },
      { customerPriceValue: 10000, pricingStatus: "VERIFIED" }
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].fieldChanged).toBe("pricingStatus");
  });

  it("stringifies null values consistently as null, not the string 'null'", () => {
    const entries = diffPricingFields(
      "Product",
      "prod-1",
      "admin-1",
      "UPDATE",
      { customerPriceValue: 10000 },
      { customerPriceValue: null }
    );
    expect(entries[0].newValue).toBeNull();
  });

  it("only compares fields relevant to the given entity type", () => {
    const entries = diffPricingFields(
      "Package",
      "pkg-1",
      "admin-1",
      "UPDATE",
      { priceType: "QUOTE_ONLY", cameraCount: 4 },
      { priceType: "STARTING_FROM", cameraCount: 8 }
    );
    // cameraCount is not a Package pricing field — must not appear.
    expect(entries.map((e) => e.fieldChanged)).toEqual(["priceType"]);
  });
});
