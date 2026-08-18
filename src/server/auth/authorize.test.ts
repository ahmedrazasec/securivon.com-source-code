import { describe, it, expect } from "vitest";
import { isAuthorized } from "@/server/auth/authorize";
import type { AdminSessionPayload } from "@/server/auth/session";

function session(overrides: Partial<AdminSessionPayload> = {}): AdminSessionPayload {
  return { sub: "user-1", email: "admin@securivon.com", role: "ADMIN", ...overrides };
}

describe("isAuthorized", () => {
  it("rejects a null session for every action", () => {
    expect(isAuthorized(null, "VIEW_ADMIN")).toBe(false);
    expect(isAuthorized(null, "EDIT_PRICING")).toBe(false);
  });

  it("authorizes an ADMIN session for admin actions", () => {
    expect(isAuthorized(session({ role: "ADMIN" }), "VIEW_ADMIN")).toBe(true);
    expect(isAuthorized(session({ role: "ADMIN" }), "EDIT_PRICING")).toBe(true);
  });

  it("rejects non-ADMIN roles at MVP, since no per-role rules are defined yet", () => {
    expect(isAuthorized(session({ role: "CONTENT_EDITOR" }), "VIEW_ADMIN")).toBe(false);
    expect(isAuthorized(session({ role: "PRICING_MANAGER" }), "EDIT_PRICING")).toBe(false);
    expect(isAuthorized(session({ role: "SALES_OPERATIONS" }), "MANAGE_LEADS")).toBe(false);
  });
});
