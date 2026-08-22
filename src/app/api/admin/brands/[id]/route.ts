import type { NextRequest } from "next/server";
import { updateBrand, deactivateBrand } from "@/server/adminRoutes/catalogueSupport";

/**
 * Real mount point for the single-Brand Admin API. All logic lives in
 * src/server/adminRoutes/catalogueSupport.ts. DELETE maps to
 * deactivateBrand (Brand uses `active` boolean, no hard delete).
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updateBrand(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return deactivateBrand(request, id);
}
