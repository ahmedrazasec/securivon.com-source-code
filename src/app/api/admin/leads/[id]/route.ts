import type { NextRequest } from "next/server";
import { GET_ONE, UPDATE_STATUS } from "@/server/adminRoutes/leads";

/**
 * Real mount point for the single-Lead Admin API.
 *
 * All request handling, authorization, and data access live in
 * src/server/adminRoutes/leads.ts (GET_ONE, UPDATE_STATUS) — this file
 * only adapts Next.js's async route params to that handler's
 * (request, id) signature. PATCH is status-only (Batch 3) — see
 * UPDATE_STATUS's own doc comment.
 */

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return GET_ONE(request, id);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return UPDATE_STATUS(request, id);
}
