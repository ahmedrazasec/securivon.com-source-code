import type { NextRequest } from "next/server";
import { GET_ONE } from "@/server/adminRoutes/quotes";

/**
 * Real mount point for the single-Quote Admin API (read-only).
 *
 * All request handling, authorization, and data access live in
 * src/server/adminRoutes/quotes.ts (GET_ONE) — this file only adapts
 * Next.js's async route params to that handler's (request, id) signature.
 */

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return GET_ONE(request, id);
}
