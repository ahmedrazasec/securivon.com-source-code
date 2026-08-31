import "server-only";
import type { SiteSurveyRequestRepository, SiteSurveyRequestListRecord, SiteSurveyRequestDetailRecord } from "@/server/repositories/types";

/**
 * Pure SiteSurveyRequest status-update logic (Batch 3) — deliberately has
 * NO import of src/server/container.ts, matching
 * src/server/crm/leadStatus.ts. Same minimal approach as Lead — any valid
 * enum value is accepted, no transition state machine. A site survey's
 * REQUESTED → SCHEDULED → COMPLETED / CANCELLED progression is an
 * operational scheduling fact tracked by hand (calling the customer,
 * booking a visit), not something this system validates the sequence of.
 */

export type SiteSurveyStatusUpdateResult =
  | { ok: true; siteSurvey: SiteSurveyRequestDetailRecord }
  | { ok: false; reason: "NOT_FOUND" };

export async function updateSiteSurveyStatusCore(
  id: string,
  status: SiteSurveyRequestListRecord["status"],
  repository: Pick<SiteSurveyRequestRepository, "findById" | "updateStatus">
): Promise<SiteSurveyStatusUpdateResult> {
  const existing = await repository.findById(id);
  if (!existing) return { ok: false, reason: "NOT_FOUND" };

  const siteSurvey = await repository.updateStatus(id, status);
  if (!siteSurvey) return { ok: false, reason: "NOT_FOUND" };
  return { ok: true, siteSurvey };
}
