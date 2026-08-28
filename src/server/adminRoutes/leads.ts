import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";
import { parseStatusFilter } from "@/server/adminRoutes/statusFilter";

/**
 * Leads Admin route handlers — read-only.
 *
 * Mounted at src/app/api/admin/leads/route.ts (GET) and
 * src/app/api/admin/leads/[id]/route.ts (GET) — those files
 * re-export/adapt the functions below rather than duplicating logic.
 *
 * Uses the "MANAGE_LEADS" action (isAuthorized currently grants every
 * action to any ADMIN session, but this keeps the intent explicit and
 * ready for the day per-role permissions are implemented).
 */

const VALID_STATUSES = ["NEW", "CONTACTED", "SITE_SURVEY_SCHEDULED", "QUOTED", "WON", "LOST"] as const;

export async function GET(request: NextRequest) {
  return withAdminAuth(request, "MANAGE_LEADS", async () => {
    const { searchParams } = new URL(request.url);
    const status = parseStatusFilter(VALID_STATUSES, searchParams.get("status"));
    const leads = await container.leads.list({ status });
    return NextResponse.json({ leads });
  });
}

export async function GET_ONE(request: NextRequest, id: string) {
  return withAdminAuth(request, "MANAGE_LEADS", async () => {
    const lead = await container.leads.findById(id);
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    return NextResponse.json({ lead });
  });
}
