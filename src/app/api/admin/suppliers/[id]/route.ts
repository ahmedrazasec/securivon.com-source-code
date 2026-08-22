import type { NextRequest } from "next/server";
import { updateSupplier, archiveSupplier } from "@/server/adminRoutes/catalogueSupport";

/**
 * Real mount point for the single-Supplier Admin API. All logic lives in
 * src/server/adminRoutes/catalogueSupport.ts. DELETE maps to
 * archiveSupplier (Supplier is soft-deleted via `deletedAt`, matching the
 * schema — same pattern as Product, not the `active`-boolean pattern used
 * by Category/Brand).
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updateSupplier(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return archiveSupplier(request, id);
}
