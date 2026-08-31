import { describe, it, expect } from "vitest";
import { updateSiteSurveyStatusCore } from "@/server/crm/siteSurveyStatus";
import { InMemorySiteSurveyRequestRepository } from "@test-fakes/repositories";
import type { SiteSurveyRequestDetailRecord } from "@/server/repositories/types";

function baseSiteSurvey(overrides: Partial<SiteSurveyRequestDetailRecord> = {}): SiteSurveyRequestDetailRecord {
  return {
    id: "survey-1",
    leadId: "lead-1",
    name: "Ali Raza",
    phone: "03001234567",
    propertyType: "HOME",
    location: "Rawalpindi",
    preferredDateTime: null,
    configurationReference: null,
    status: "REQUESTED",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    notes: null,
    customer: { id: "cust-1", name: "Ali Raza", phone: "03001234567", whatsappNumber: null, email: null, addressArea: null, source: "REQUEST_QUOTE_FORM", createdAt: "2026-08-01T00:00:00.000Z" },
    ...overrides,
  };
}

describe("updateSiteSurveyStatusCore", () => {
  it("updates status on a valid, existing site survey request", async () => {
    const repo = new InMemorySiteSurveyRequestRepository([baseSiteSurvey()]);
    const result = await updateSiteSurveyStatusCore("survey-1", "SCHEDULED", repo);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.siteSurvey.status).toBe("SCHEDULED");
  });

  it("allows any-to-any transition (no state machine, matches Lead's approach)", async () => {
    const repo = new InMemorySiteSurveyRequestRepository([baseSiteSurvey({ status: "COMPLETED" })]);
    const result = await updateSiteSurveyStatusCore("survey-1", "REQUESTED", repo);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.siteSurvey.status).toBe("REQUESTED");
  });

  it("returns NOT_FOUND for a nonexistent site survey id, and writes nothing", async () => {
    const repo = new InMemorySiteSurveyRequestRepository([baseSiteSurvey()]);
    const result = await updateSiteSurveyStatusCore("does-not-exist", "SCHEDULED", repo);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("NOT_FOUND");
    expect((await repo.findById("survey-1"))?.status).toBe("REQUESTED");
  });

  it("preserves unrelated fields (location, phone, customer) when updating status", async () => {
    const repo = new InMemorySiteSurveyRequestRepository([baseSiteSurvey({ location: "Islamabad" })]);
    const result = await updateSiteSurveyStatusCore("survey-1", "CANCELLED", repo);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.siteSurvey.location).toBe("Islamabad");
      expect(result.siteSurvey.phone).toBe("03001234567");
      expect(result.siteSurvey.customer.name).toBe("Ali Raza");
    }
  });
});
