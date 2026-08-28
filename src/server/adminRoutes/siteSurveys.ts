import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";
import { parseStatusFilter } from "@/server/adminRoutes/statusFilter";

/**
 * Site Surveys Admin route handlers — read-only.
 *
 * Mounted at src/app/api/admin/site-surveys/route.ts (GET) and
 * src/app/api/admin/site-surveys/[id]/route.ts (GET) — those files
 * re-export/adapt the functions below rather than duplicating logic.
 */

const VALID_STATUSES = ["REQUESTED", "SCHEDULED", "COMPLETED", "CANCELLED"] as const;

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
