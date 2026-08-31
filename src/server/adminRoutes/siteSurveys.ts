import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";
import { parseStatusFilter } from "@/server/adminRoutes/statusFilter";
import { updateSiteSurveyStatusCore } from "@/server/crm/siteSurveyStatus";

/**
 * Site Surveys Admin route handlers — read-only except for status.
 *
 * Mounted at src/app/api/admin/site-surveys/route.ts (GET) and
 * src/app/api/admin/site-surveys/[id]/route.ts (GET, PATCH) — those files
 * re-export/adapt the functions below rather than duplicating logic.
 *
 * The actual status-update logic (Batch 3) lives in
 * src/server/crm/siteSurveyStatus.ts — kept separate from this file for
 * the same container.ts-independence reason as leads.ts. This file is
 * just the thin, container-wired route wrapper.
 */

const VALID_STATUSES = ["REQUESTED", "SCHEDULED", "COMPLETED", "CANCELLED"] as const;

const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUSES),
});

export async function GET(request: NextRequest) {
  return withAdminAuth(request, "MANAGE_LEADS", async () => {
    const { searchParams } = new URL(request.url);
    const status = parseStatusFilter(VALID_STATUSES, searchParams.get("status"));
    const siteSurveys = await container.siteSurveyRequests.list({ status });
    return NextResponse.json({ siteSurveys });
  });
}

export async function GET_ONE(request: NextRequest, id: string) {
  return withAdminAuth(request, "MANAGE_LEADS", async () => {
    const siteSurvey = await container.siteSurveyRequests.findById(id);
    if (!siteSurvey) return NextResponse.json({ error: "Site survey request not found." }, { status: 404 });
    return NextResponse.json({ siteSurvey });
  });
}

export async function UPDATE_STATUS(request: NextRequest, id: string) {
  return withAdminAuth(request, "MANAGE_LEADS", async () => {
    const parsed = updateStatusSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status.", details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await updateSiteSurveyStatusCore(id, parsed.data.status, container.siteSurveyRequests);
    if (!result.ok) return NextResponse.json({ error: "Site survey request not found." }, { status: 404 });
    return NextResponse.json({ siteSurvey: result.siteSurvey });
  });
}
