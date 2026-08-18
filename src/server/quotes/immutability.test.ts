import { describe, it, expect } from "vitest";
import { createRevision, canTransitionStatus } from "@/server/quotes/immutability";
import type { QuoteSnapshot } from "@/server/quotes/immutability";

function baseQuote(): QuoteSnapshot {
  return {
    id: "quote-1",
    leadId: "lead-1",
    status: "SENT",
    totalEstimatedLow: 100000,
    totalEstimatedHigh: 120000,
    configurationSnapshot: { cameraCount: 4 },
    pricingRulesSnapshot: { taxRate: 0 },
    revisedFromQuoteId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("quote immutability", () => {
  it("createRevision never mutates the original quote object", () => {
    const original = baseQuote();
    const originalCopy = JSON.parse(JSON.stringify(original));

    createRevision(original, "quote-2", { totalEstimatedLow: 999999 });

    expect(original).toEqual(originalCopy);
  });

  it("createRevision produces a new quote linked to the original via revisedFromQuoteId", () => {
    const original = baseQuote();
    const revision = createRevision(original, "quote-2", { totalEstimatedLow: 150000 });

    expect(revision.id).toBe("quote-2");
    expect(revision.revisedFromQuoteId).toBe(original.id);
    expect(revision.totalEstimatedLow).toBe(150000);
    // Unspecified fields carry over from the original.
    expect(revision.totalEstimatedHigh).toBe(original.totalEstimatedHigh);
    expect(revision.leadId).toBe(original.leadId);
  });

  it("a revision always starts in DRAFT status regardless of the original's status", () => {
    const original = { ...baseQuote(), status: "ACCEPTED" as const };
    const revision = createRevision(original, "quote-2", {});
    expect(revision.status).toBe("DRAFT");
  });

  it("allows only forward status transitions", () => {
    expect(canTransitionStatus("DRAFT", "SENT")).toBe(true);
    expect(canTransitionStatus("SENT", "ACCEPTED")).toBe(true);
    expect(canTransitionStatus("SENT", "EXPIRED")).toBe(true);
  });

  it("never allows an ACCEPTED or EXPIRED quote to transition again", () => {
    expect(canTransitionStatus("ACCEPTED", "DRAFT")).toBe(false);
    expect(canTransitionStatus("ACCEPTED", "SENT")).toBe(false);
    expect(canTransitionStatus("EXPIRED", "SENT")).toBe(false);
  });

  it("never allows skipping backward from ACCEPTED to DRAFT via any path", () => {
    expect(canTransitionStatus("DRAFT", "ACCEPTED")).toBe(false); // must pass through SENT
  });
});
