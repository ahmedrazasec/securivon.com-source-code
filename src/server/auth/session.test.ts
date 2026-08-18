import { describe, it, expect, beforeAll } from "vitest";
import { createAdminSessionToken, verifyAdminSessionToken } from "@/server/auth/session";

beforeAll(() => {
  // A 32+ char test-only secret — never a real value, and never read from
  // any committed file (see .env.example, which contains only a placeholder).
  process.env.AUTH_SECRET = "test-only-secret-value-not-for-production-use-1234";
});

describe("Admin session tokens", () => {
  it("round-trips a valid token", async () => {
    const token = await createAdminSessionToken({
      sub: "user-1",
      email: "admin@securivon.com",
      role: "ADMIN",
    });
    const verified = await verifyAdminSessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe("admin@securivon.com");
    expect(verified?.role).toBe("ADMIN");
  });

  it("rejects a tampered token", async () => {
    const token = await createAdminSessionToken({
      sub: "user-1",
      email: "admin@securivon.com",
      role: "ADMIN",
    });
    const tampered = token.slice(0, -2) + (token.slice(-2) === "aa" ? "bb" : "aa");
    const verified = await verifyAdminSessionToken(tampered);
    expect(verified).toBeNull();
  });

  it("rejects a malformed token without throwing", async () => {
    const verified = await verifyAdminSessionToken("not-a-real-token");
    expect(verified).toBeNull();
  });

  it("throws a clear error if AUTH_SECRET is missing or too short", async () => {
    const original = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "too-short";
    await expect(
      createAdminSessionToken({ sub: "u", email: "a@b.com", role: "ADMIN" })
    ).rejects.toThrow(/AUTH_SECRET/);
    process.env.AUTH_SECRET = original;
  });
});
