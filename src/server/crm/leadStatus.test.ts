import { describe, it, expect } from "vitest";
import { updateLeadStatusCore } from "@/server/crm/leadStatus";
import { InMemoryLeadRepository } from "@test-fakes/repositories";
import type { LeadDetailRecord } from "@/server/repositories/types";

function baseLead(overrides: Partial<LeadDetailRecord> = {}): LeadDetailRecord {
  return {
    id: "lead-1",
    journeySource: "DIRECT_CONTACT",
    status: "NEW",
    assignedTo: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    customer: { id: "cust-1", name: "Ali Raza", phone: "03001234567", whatsappNumber: null, email: null, addressArea: null, source: "REQUEST_QUOTE_FORM", createdAt: "2026-08-01T00:00:00.000Z" },
    quoteCount: 0,
    siteSurveyRequestCount: 0,
    quotes: [],
    siteSurveyRequests: [],
    ...overrides,
  };
}

describe("updateLeadStatusCore", () => {
  it("updates status on a valid, existing lead", async () => {
    const repo = new InMemoryLeadRepository([baseLead()]);
    const result = await updateLeadStatusCore("lead-1", "CONTACTED", repo);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lead.status).toBe("CONTACTED");
  });

  it("allows any-to-any transition (no state machine for Lead, unlike Quote)", async () => {
    const repo = new InMemoryLeadRepository([baseLead({ status: "WON" })]);
    const result = await updateLeadStatusCore("lead-1", "NEW", repo);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lead.status).toBe("NEW");
  });

  it("returns NOT_FOUND for a nonexistent lead id, and writes nothing", async () => {
    const repo = new InMemoryLeadRepository([baseLead()]);
    const result = await updateLeadStatusCore("does-not-exist", "CONTACTED", repo);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("NOT_FOUND");
    // Original lead untouched.
    expect((await repo.findById("lead-1"))?.status).toBe("NEW");
  });

  it("preserves every unrelated field (customer, journeySource, counts) when updating status", async () => {
    const repo = new InMemoryLeadRepository([baseLead({ assignedTo: "ahmed@securivon.com", quoteCount: 2 })]);
    const result = await updateLeadStatusCore("lead-1", "QUOTED", repo);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lead.assignedTo).toBe("ahmed@securivon.com");
      expect(result.lead.quoteCount).toBe(2);
      expect(result.lead.customer.name).toBe("Ali Raza");
      expect(result.lead.journeySource).toBe("DIRECT_CONTACT");
    }
  });
});
