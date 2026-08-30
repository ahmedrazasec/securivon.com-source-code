import { describe, it, expect } from "vitest";
import { authenticateAdmin, changeOwnPassword } from "@/server/repositories/adminUserRepository";
import type { AdminUserRepository, AdminUserRecord } from "@/server/repositories/adminUserRepository";
import { hashPassword, verifyPassword } from "@/server/auth/password";

/**
 * Proves `authenticateAdmin` is correct against ANY AdminUserRepository
 * implementation — using a fake here that behaves exactly like the future
 * Prisma-backed one would (findByEmail queries a store, returns a record or
 * null). This is the closest this sandbox can get to "test authentication
 * against database" (Stage 2 §15) without a live Postgres instance: the
 * repository *interface* and the *logic that consumes it* are fully proven
 * here; only the actual SQL round-trip (repositories/prisma/adminUser.prisma.ts)
 * is unverified, and that file contains no logic of its own — it's a thin
 * Prisma-query adapter to this same interface.
 */
class FakeDbAdminUserRepository implements AdminUserRepository {
  constructor(private readonly users: AdminUserRecord[]) {}
  async findByEmail(email: string): Promise<AdminUserRecord | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
  }
  async findById(id: string): Promise<AdminUserRecord | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) user.passwordHash = passwordHash;
  }
}

describe("authenticateAdmin against a database-shaped repository", () => {
  it("authenticates successfully with correct credentials", async () => {
    const passwordHash = await hashPassword("CorrectHorseBatteryStaple1!");
    const repo = new FakeDbAdminUserRepository([
      { id: "u1", email: "admin@securivon.com", passwordHash, role: "ADMIN", active: true },
    ]);

    const result = await authenticateAdmin("admin@securivon.com", "CorrectHorseBatteryStaple1!", repo);
    expect(result?.id).toBe("u1");
    expect(result?.role).toBe("ADMIN");
  });

  it("rejects a correct email with the wrong password", async () => {
    const passwordHash = await hashPassword("CorrectHorseBatteryStaple1!");
    const repo = new FakeDbAdminUserRepository([
      { id: "u1", email: "admin@securivon.com", passwordHash, role: "ADMIN", active: true },
    ]);

    const result = await authenticateAdmin("admin@securivon.com", "wrong-password", repo);
    expect(result).toBeNull();
  });

  it("rejects an email that does not exist in the repository", async () => {
    const repo = new FakeDbAdminUserRepository([]);
    const result = await authenticateAdmin("nobody@securivon.com", "anything", repo);
    expect(result).toBeNull();
  });

  it("rejects a deactivated admin account even with correct credentials", async () => {
    const passwordHash = await hashPassword("CorrectHorseBatteryStaple1!");
    const repo = new FakeDbAdminUserRepository([
      { id: "u1", email: "admin@securivon.com", passwordHash, role: "ADMIN", active: false },
    ]);

    const result = await authenticateAdmin("admin@securivon.com", "CorrectHorseBatteryStaple1!", repo);
    expect(result).toBeNull();
  });

  it("email matching is case-insensitive, matching how a real DB lookup would typically be configured", async () => {
    const passwordHash = await hashPassword("CorrectHorseBatteryStaple1!");
    const repo = new FakeDbAdminUserRepository([
      { id: "u1", email: "Admin@Securivon.com", passwordHash, role: "ADMIN", active: true },
    ]);

    const result = await authenticateAdmin("admin@securivon.com", "CorrectHorseBatteryStaple1!", repo);
    expect(result?.id).toBe("u1");
  });

  it("supports multiple admin users, authenticating only the matching one", async () => {
    const hash1 = await hashPassword("PasswordOne1!");
    const hash2 = await hashPassword("PasswordTwo2!");
    const repo = new FakeDbAdminUserRepository([
      { id: "u1", email: "one@securivon.com", passwordHash: hash1, role: "ADMIN", active: true },
      { id: "u2", email: "two@securivon.com", passwordHash: hash2, role: "CONTENT_EDITOR", active: true },
    ]);

    const result = await authenticateAdmin("two@securivon.com", "PasswordTwo2!", repo);
    expect(result?.id).toBe("u2");
    expect(result?.role).toBe("CONTENT_EDITOR");
  });
});

describe("changeOwnPassword against a database-shaped repository", () => {
  it("changes the password when the current password is correct", async () => {
    const passwordHash = await hashPassword("OldPassword1!");
    const repo = new FakeDbAdminUserRepository([
      { id: "u1", email: "admin@securivon.com", passwordHash, role: "ADMIN", active: true },
    ]);

    const result = await changeOwnPassword("u1", "OldPassword1!", "NewPassword2!", repo);
    expect(result.ok).toBe(true);

    const updated = await repo.findById("u1");
    expect(await verifyPassword("NewPassword2!", updated!.passwordHash)).toBe(true);
    expect(await verifyPassword("OldPassword1!", updated!.passwordHash)).toBe(false);
  });

  it("rejects when the current password is wrong, and does not change the stored hash", async () => {
    const passwordHash = await hashPassword("OldPassword1!");
    const repo = new FakeDbAdminUserRepository([
      { id: "u1", email: "admin@securivon.com", passwordHash, role: "ADMIN", active: true },
    ]);

    const result = await changeOwnPassword("u1", "WrongPassword!", "NewPassword2!", repo);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INCORRECT_CURRENT_PASSWORD");

    const unchanged = await repo.findById("u1");
    expect(await verifyPassword("OldPassword1!", unchanged!.passwordHash)).toBe(true);
  });

  it("rejects when the user id does not exist", async () => {
    const repo = new FakeDbAdminUserRepository([]);
    const result = await changeOwnPassword("missing", "anything", "NewPassword2!", repo);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("NOT_FOUND");
  });

  it("rejects when the account is deactivated", async () => {
    const passwordHash = await hashPassword("OldPassword1!");
    const repo = new FakeDbAdminUserRepository([
      { id: "u1", email: "admin@securivon.com", passwordHash, role: "ADMIN", active: false },
    ]);

    const result = await changeOwnPassword("u1", "OldPassword1!", "NewPassword2!", repo);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("NOT_FOUND");
  });

  it("rejects the env-bootstrap account id, which has no row to update", async () => {
    const passwordHash = await hashPassword("OldPassword1!");
    const repo = new FakeDbAdminUserRepository([
      { id: "bootstrap-admin", email: "admin@securivon.com", passwordHash, role: "ADMIN", active: true },
    ]);

    const result = await changeOwnPassword("bootstrap-admin", "OldPassword1!", "NewPassword2!", repo);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("BOOTSTRAP_ACCOUNT");
  });
});
