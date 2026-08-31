import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";
import { parseStatusFilter } from "@/server/adminRoutes/statusFilter";
import { updateLeadStatusCore } from "@/server/crm/leadStatus";

/**
 * Leads Admin route handlers — read-only except for status.
 *
 * Mounted at src/app/api/admin/leads/route.ts (GET) and
 * src/app/api/admin/leads/[id]/route.ts (GET, PATCH) — those files
 * re-export/adapt the functions below rather than duplicating logic.
 *
 * Uses the "MANAGE_LEADS" action (isAuthorized currently grants every
 * action to any ADMIN session, but this keeps the intent explicit and
 * ready for the day per-role permissions are implemented).
 *
 * The actual status-update logic (Batch 3) lives in
 * src/server/crm/leadStatus.ts — kept separate from this file specifically
 * so it's testable against a fake repository without transitively pulling
 * in container.ts (which imports every Prisma repository). This file is
 * just the thin, container-wired route wrapper.
 */

const VALID_STATUSES = ["NEW", "CONTACTED", "SITE_SURVEY_SCHEDULED", "QUOTED", "WON", "LOST"] as const;

const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUSES),
});

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

export async function UPDATE_STATUS(request: NextRequest, id: string) {
  return withAdminAuth(request, "MANAGE_LEADS", async () => {
    const parsed = updateStatusSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status.", details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await updateLeadStatusCore(id, parsed.data.status, container.leads);
    if (!result.ok) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    return NextResponse.json({ lead: result.lead });
  });
}
