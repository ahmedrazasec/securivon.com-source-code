import type { NextRequest } from "next/server";
import { GET_ONE, PATCH_ONE, ARCHIVE_ONE } from "@/server/adminRoutes/products";

/**
 * Real mount point for the single-Product Admin API.
 *
 * All request handling, validation, authorization, and persistence logic
 * lives in src/server/adminRoutes/products.ts (GET_ONE / PATCH_ONE /
 * ARCHIVE_ONE) — this file only adapts Next.js's async route params to
 * that handler's (request, id) signature. Do not add logic here.
 *
 * DELETE maps to ARCHIVE_ONE deliberately: products are soft-deleted
 * (archived), matching the pricing-status/audit-log architecture — there
 * is no hard-delete path for a Product.
 */

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return GET_ONE(request, id);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return PATCH_ONE(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return ARCHIVE_ONE(request, id);
}
