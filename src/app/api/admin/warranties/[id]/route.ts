import type { NextRequest } from "next/server";
import { updateWarranty, deactivateWarranty } from "@/server/adminRoutes/catalogueSupport";

/**
 * Real mount point for the single-Warranty Admin API. All logic lives in
 * src/server/adminRoutes/catalogueSupport.ts. DELETE maps to
 * deactivateWarranty (Warranty uses `active` boolean, no hard delete).
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updateWarranty(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return deactivateWarranty(request, id);
}
