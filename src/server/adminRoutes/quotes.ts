import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";
import { parseStatusFilter } from "@/server/adminRoutes/statusFilter";

/**
 * Quotes Admin route handlers — read-only.
 *
 * Mounted at src/app/api/admin/quotes/route.ts (GET) and
 * src/app/api/admin/quotes/[id]/route.ts (GET) — those files
 * re-export/adapt the functions below rather than duplicating logic.
 *
 * Never mutates a Quote — the immutability rules in
 * src/server/quotes/immutability.ts and the frozen configurationSnapshot/
 * pricingRulesSnapshot fields stay exactly as written at submission time.
 */

const VALID_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "EXPIRED"] as const;

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
