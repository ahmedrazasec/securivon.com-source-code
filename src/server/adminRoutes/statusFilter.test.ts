import { describe, it, expect } from "vitest";
import { parseStatusFilter } from "@/server/adminRoutes/statusFilter";

const LEAD_STATUSES = ["NEW", "CONTACTED", "SITE_SURVEY_SCHEDULED", "QUOTED", "WON", "LOST"] as const;

describe("parseStatusFilter", () => {
  it("returns the value when it's in the allowlist", () => {
    expect(parseStatusFilter(LEAD_STATUSES, "QUOTED")).toBe("QUOTED");
  });

  it("returns undefined for null (no query param supplied)", () => {
    expect(parseStatusFilter(LEAD_STATUSES, null)).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(parseStatusFilter(LEAD_STATUSES, "")).toBeUndefined();
  });

  it("returns undefined for a value outside the allowlist, rather than passing it through", () => {
    // Guards against a crafted query string reaching Prisma's `where` with
    // an arbitrary/invalid enum value.
    expect(parseStatusFilter(LEAD_STATUSES, "DROP TABLE leads")).toBeUndefined();
  });

  it("is case-sensitive — lowercase input does not match", () => {
    expect(parseStatusFilter(LEAD_STATUSES, "quoted")).toBeUndefined();
  });
});
