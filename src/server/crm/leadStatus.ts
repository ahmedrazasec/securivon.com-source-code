import "server-only";
import type { LeadRepository, LeadListRecord, LeadDetailRecord } from "@/server/repositories/types";

/**
 * Pure Lead status-update logic (Batch 3) — deliberately has NO import of
 * src/server/container.ts. A Lead's status is a simple business
 * classification (new/contacted/won/lost/...), not a frozen record like
 * Quote, so any-to-any transition is allowed here; enum-membership is
 * already enforced by the Zod schema in src/server/adminRoutes/leads.ts
 * before this ever runs. Never touches customer data, journeySource, or
 * anything else on the row.
 *
 * Kept in its own file, separate from adminRoutes/leads.ts, specifically
 * so it stays testable against a fake repository without transitively
 * pulling in container.ts (which imports every Prisma repository) — same
 * reasoning as src/server/quotes/immutability.ts being dependency-free.
 */

export type LeadStatusUpdateResult = { ok: true; lead: LeadDetailRecord } | { ok: false; reason: "NOT_FOUND" };

export async function updateLeadStatusCore(
  id: string,
  status: LeadListRecord["status"],
  repository: Pick<LeadRepository, "findById" | "updateStatus">
): Promise<LeadStatusUpdateResult> {
  const existing = await repository.findById(id);
  if (!existing) return { ok: false, reason: "NOT_FOUND" };

  const lead = await repository.updateStatus(id, status);
  // updateStatus can only return null here if the row vanished between the
  // findById above and this call (a real race, not a validation failure) —
  // treat it the same as "not found" rather than throwing.
  if (!lead) return { ok: false, reason: "NOT_FOUND" };
  return { ok: true, lead };
}
