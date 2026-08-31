import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";
import { parseStatusFilter } from "@/server/adminRoutes/statusFilter";
import { updateQuoteStatusCore } from "@/server/crm/quoteStatus";

/**
 * Quotes Admin route handlers — read-only except for status.
 *
 * Mounted at src/app/api/admin/quotes/route.ts (GET) and
 * src/app/api/admin/quotes/[id]/route.ts (GET, PATCH) — those files
 * re-export/adapt the functions below rather than duplicating logic.
 *
 * Never mutates pricing/snapshots — the immutability rules in
 * src/server/quotes/immutability.ts and the frozen configurationSnapshot/
 * pricingRulesSnapshot fields stay exactly as written at submission time.
 * The actual status-update logic (Batch 3), including transition
 * enforcement via canTransitionStatus(), lives in
 * src/server/crm/quoteStatus.ts — kept separate from this file for the
 * same container.ts-independence reason as leads.ts. This file is just
 * the thin, container-wired route wrapper.
 */

const VALID_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "EXPIRED"] as const;

const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUSES),
});

export async function GET(request: NextRequest) {
  return withAdminAuth(request, "MANAGE_LEADS", async () => {
    const { searchParams } = new URL(request.url);
    const status = parseStatusFilter(VALID_STATUSES, searchParams.get("status"));
    const quotes = await container.quotes.list({ status });
    return NextResponse.json({ quotes });
  });
}

export async function GET_ONE(request: NextRequest, id: string) {
  return withAdminAuth(request, "MANAGE_LEADS", async () => {
    const quote = await container.quotes.findById(id);
    if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    return NextResponse.json({ quote });
  });
}

export async function UPDATE_STATUS(request: NextRequest, id: string) {
  return withAdminAuth(request, "MANAGE_LEADS", async () => {
    const parsed = updateStatusSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status.", details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await updateQuoteStatusCore(id, parsed.data.status, container.quotes);
    if (!result.ok) {
      if (result.reason === "INVALID_TRANSITION") {
        return NextResponse.json({ error: `Cannot change status from ${result.from} to ${result.to}.` }, { status: 400 });
      }
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }
    return NextResponse.json({ quote: result.quote });
  });
}
