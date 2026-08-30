import { describe, it, expect, beforeEach } from "vitest";
import {
  isLoginRateLimited,
  recordFailedLoginAttempt,
  emailIdentifier,
  ipIdentifier,
  MAX_FAILED_ATTEMPTS,
  WINDOW_MS,
} from "@/server/auth/loginRateLimit";
import { InMemoryLoginAttemptRepository } from "@test-fakes/repositories";

describe("emailIdentifier / ipIdentifier", () => {
  it("normalizes email to lowercase and trims whitespace", () => {
    expect(emailIdentifier("  Admin@Securivon.com  ")).toBe("email:admin@securivon.com");
  });

  it("prefixes IP distinctly from email so the two dimensions can never collide", () => {
    expect(ipIdentifier("203.0.113.5")).toBe("ip:203.0.113.5");
  });
});

describe("isLoginRateLimited / recordFailedLoginAttempt", () => {
  let loginAttempts: InMemoryLoginAttemptRepository;
  const deps = () => ({ loginAttempts });
  const now = 1_800_000_000_000; // fixed reference instant

  beforeEach(() => {
    loginAttempts = new InMemoryLoginAttemptRepository();
  });

  it("is not rate limited with zero prior failures", async () => {
    const blocked = await isLoginRateLimited(deps(), [emailIdentifier("a@b.com"), ipIdentifier("1.2.3.4")], now);
    expect(blocked).toBe(false);
  });

  it("is not rate limited just below the threshold", async () => {
    const id = emailIdentifier("a@b.com");
    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) {
      await recordFailedLoginAttempt(deps(), [id], now);
    }
    expect(await isLoginRateLimited(deps(), [id], now)).toBe(false);
  });

  it("becomes rate limited once the threshold is reached", async () => {
    const id = emailIdentifier("a@b.com");
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await recordFailedLoginAttempt(deps(), [id], now);
    }
    expect(await isLoginRateLimited(deps(), [id], now)).toBe(true);
  });

  it("blocks if EITHER identifier (email or IP) is over the limit, not just both", async () => {
    const emailId = emailIdentifier("victim@securivon.com");
    const ipId = ipIdentifier("9.9.9.9");
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await recordFailedLoginAttempt(deps(), [ipId], now);
    }
    // Attacker's IP is over the limit; victim's email identifier alone has
    // zero failures — a request carrying both must still be blocked.
    expect(await isLoginRateLimited(deps(), [emailId, ipId], now)).toBe(true);
  });

  it("keeps email and IP failure counts independent of each other", async () => {
    const emailId = emailIdentifier("a@b.com");
    const ipId = ipIdentifier("1.2.3.4");
    await recordFailedLoginAttempt(deps(), [emailId], now);
    expect(await loginAttempts.countRecentFailures(emailId, now - WINDOW_MS)).toBe(1);
    expect(await loginAttempts.countRecentFailures(ipId, now - WINDOW_MS)).toBe(0);
  });

  it("does not count failures outside the time window", async () => {
    const id = emailIdentifier("a@b.com");
    const longAgo = now - WINDOW_MS - 1000;
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await recordFailedLoginAttempt(deps(), [id], longAgo);
    }
    // All failures happened before the current window started.
    expect(await isLoginRateLimited(deps(), [id], now)).toBe(false);
  });

  it("a request from a fresh IP against a locked-out email is still blocked (email dimension alone is enough)", async () => {
    const emailId = emailIdentifier("targeted@securivon.com");
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await recordFailedLoginAttempt(deps(), [emailId], now);
    }
    const freshIp = ipIdentifier("8.8.8.8");
    expect(await isLoginRateLimited(deps(), [emailId, freshIp], now)).toBe(true);
  });
});
