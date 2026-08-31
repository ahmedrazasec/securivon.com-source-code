import { describe, it, expect } from "vitest";
import { updateQuoteStatusCore } from "@/server/crm/quoteStatus";
import { InMemoryQuoteRepository } from "@test-fakes/repositories";
import type { QuoteDetailRecord } from "@/server/repositories/types";

function baseQuote(overrides: Partial<QuoteDetailRecord> = {}): QuoteDetailRecord {
  return {
    id: "quote-1",
    leadId: "lead-1",
    packageId: null,
    type: "CONFIGURATOR_ESTIMATE",
    status: "DRAFT",
    totalEstimatedLow: 54280,
    totalEstimatedHigh: 67850,
    isEstimateOnly: true,
    siteSurveyRequired: false,
    revisedFromQuoteId: null,
    validUntil: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    customer: { id: "cust-1", name: "Ali Raza", phone: "03001234567", whatsappNumber: null, email: null, addressArea: null, source: "REQUEST_QUOTE_FORM", createdAt: "2026-08-01T00:00:00.000Z" },
    configurationSnapshot: { cameraCount: 4, propertyType: "HOME" },
    pricingRulesSnapshot: { discountApplied: 0, taxApplied: 0 },
    items: [],
    ...overrides,
  };
}

describe("updateQuoteStatusCore", () => {
  it("allows a valid transition (DRAFT -> SENT)", async () => {
    const repo = new InMemoryQuoteRepository([baseQuote({ status: "DRAFT" })]);
    const result = await updateQuoteStatusCore("quote-1", "SENT", repo);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.quote.status).toBe("SENT");
  });

  it("allows SENT -> ACCEPTED", async () => {
    const repo = new InMemoryQuoteRepository([baseQuote({ status: "SENT" })]);
    const result = await updateQuoteStatusCore("quote-1", "ACCEPTED", repo);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.quote.status).toBe("ACCEPTED");
  });

  it("rejects an invalid transition (DRAFT -> ACCEPTED, skipping SENT), and writes nothing", async () => {
    const repo = new InMemoryQuoteRepository([baseQuote({ status: "DRAFT" })]);
    const result = await updateQuoteStatusCore("quote-1", "ACCEPTED", repo);
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === "INVALID_TRANSITION") {
      expect(result.from).toBe("DRAFT");
      expect(result.to).toBe("ACCEPTED");
    }
    expect((await repo.findById("quote-1"))?.status).toBe("DRAFT");
  });

  it("rejects any transition out of a terminal status (ACCEPTED -> anything)", async () => {
    const repo = new InMemoryQuoteRepository([baseQuote({ status: "ACCEPTED" })]);
    const result = await updateQuoteStatusCore("quote-1", "SENT", repo);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_TRANSITION");
  });

  it("returns NOT_FOUND for a nonexistent quote id", async () => {
    const repo = new InMemoryQuoteRepository([baseQuote()]);
    const result = await updateQuoteStatusCore("does-not-exist", "SENT", repo);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("NOT_FOUND");
  });

  it("never alters pricing, snapshots, items, or customer data when updating status", async () => {
    const repo = new InMemoryQuoteRepository([baseQuote({ status: "DRAFT" })]);
    const result = await updateQuoteStatusCore("quote-1", "SENT", repo);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.quote.totalEstimatedLow).toBe(54280);
      expect(result.quote.totalEstimatedHigh).toBe(67850);
      expect(result.quote.configurationSnapshot).toEqual({ cameraCount: 4, propertyType: "HOME" });
      expect(result.quote.pricingRulesSnapshot).toEqual({ discountApplied: 0, taxApplied: 0 });
      expect(result.quote.customer.name).toBe("Ali Raza");
    }
  });
});
