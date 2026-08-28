/**
 * Pure helper for validating an untrusted `?status=` query param against a
 * fixed allowlist before it reaches a Prisma `where` clause.
 *
 * Extracted out of src/server/adminRoutes/{leads,quotes,siteSurveys}.ts so
 * it's testable without Prisma (matches this repo's existing convention —
 * see src/server/repositories/pricingAudit.ts / .test.ts — of unit-testing
 * pure logic separately from the database-backed layer that uses it).
 *
 * Returns undefined for anything not in the allowlist (missing, empty, or
 * garbage input) rather than throwing, so callers can treat "no valid
 * filter" as "no filter" and list everything.
 */
export function parseStatusFilter<T extends string>(candidates: readonly T[], value: string | null): T | undefined {
  return candidates.find((c) => c === value);
}
