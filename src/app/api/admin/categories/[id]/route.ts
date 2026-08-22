import type { NextRequest } from "next/server";
import { updateCategory, deactivateCategory } from "@/server/adminRoutes/catalogueSupport";

/**
 * Real mount point for the single-Category Admin API. All logic lives in
 * src/server/adminRoutes/catalogueSupport.ts — this file only adapts
 * Next.js's async route params to that handler's (request, id) signature.
 *
 * DELETE maps to deactivateCategory: categories use `active` boolean
 * deactivation, not hard delete — matching the model's `active` field
 * (no `deletedAt` column on Category).
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updateCategory(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return deactivateCategory(request, id);
}
