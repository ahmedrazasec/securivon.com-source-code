import "server-only";
import type { LoginAttemptRepository } from "@/server/repositories/types";

/**
 * Admin login brute-force protection.
 *
 * DELIBERATELY DB-BACKED (LoginAttempt table), NOT an in-memory counter.
 *
 * Why: this project has no fixed deployment target decided yet (no
 * vercel.json/Dockerfile/hosting choice in the repo as of this batch). An
 * in-memory Map-based limiter is correct ONLY if the app runs as a single,
 * long-lived process — it silently stops providing real protection the
 * moment it's deployed across multiple serverless instances or processes
 * (each instance/isolate would count attempts independently, so N
 * instances effectively multiplies the real attempt budget by N, with no
 * error or warning). Since Postgres/Supabase is already a hard dependency
 * of this app (Prisma is used everywhere else), reusing it here is the
 * smallest way to get a limiter that's correct regardless of hosting
 * topology — no new service (e.g. Redis) is introduced.
 *
 * If/when a real production deployment target is chosen and it turns out
 * to be a single always-warm process (e.g. a VPS/Docker container running
 * one Node instance), this DB round-trip on every login attempt is a small
 * amount of unnecessary latency, not a correctness problem — safe either
 * way. This trade-off (one extra fast DB query per login vs. a silently
 * broken security control) was deliberately chosen over any in-memory
 * alternative.
 *
 * Two independent identifier dimensions share this same table/logic:
 *   - "email:<normalized address>" — stops one attacker from brute-forcing
 *     one specific known admin email.
 *   - "ip:<client ip>" — stops one attacker from brute-forcing many
 *     different email addresses (enumeration) from a single source.
 * A request is blocked if EITHER dimension is currently over the limit.
 */

export const MAX_FAILED_ATTEMPTS = 5;
export const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
/** Failed-attempt rows older than this are pruned as a best-effort housekeeping step — never required for correctness, since countRecentFailures always filters by WINDOW_MS itself regardless of what else is in the table. */
const PRUNE_RETENTION_MS = 24 * 60 * 60 * 1000; // 1 day

export function emailIdentifier(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}

export function ipIdentifier(ip: string): string {
  return `ip:${ip}`;
}

export interface LoginRateLimitDeps {
  loginAttempts: Pick<LoginAttemptRepository, "countRecentFailures" | "recordFailure" | "pruneOlderThan">;
}

/**
 * Returns true if ANY of the given identifiers currently has
 * MAX_FAILED_ATTEMPTS or more failures within WINDOW_MS. Callers should
 * treat `true` as "return a generic 429" — never report which identifier
 * (email vs IP) was the one that tripped, so a caller can't use the
 * limiter itself to probe whether an email address exists.
 */
export async function isLoginRateLimited(deps: LoginRateLimitDeps, identifiers: string[], now = Date.now()): Promise<boolean> {
  const since = now - WINDOW_MS;
  for (const identifier of identifiers) {
    const count = await deps.loginAttempts.countRecentFailures(identifier, since);
    if (count >= MAX_FAILED_ATTEMPTS) return true;
  }
  return false;
}

/** Records a failed attempt against every given identifier, then opportunistically prunes old rows. Call this ONLY after a real credential check has failed — never for a rate-limited (already-blocked) request, since that would let an attacker who's already blocked keep extending their own lockout window against a victim's email/IP indefinitely. */
export async function recordFailedLoginAttempt(deps: LoginRateLimitDeps, identifiers: string[], now = Date.now()): Promise<void> {
  for (const identifier of identifiers) {
    await deps.loginAttempts.recordFailure(identifier, now);
  }
  await deps.loginAttempts.pruneOlderThan(now - PRUNE_RETENTION_MS);
}
