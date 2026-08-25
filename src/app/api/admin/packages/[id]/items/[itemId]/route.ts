import type { NextRequest } from "next/server";
import { updatePackageItem, removePackageItem } from "@/server/adminRoutes/packages";

/**
 * Real mount point for updating/removing a single Package Item. All logic
 * lives in src/server/adminRoutes/packages.ts.
 */
type RouteParams = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id, itemId } = await params;
  return updatePackageItem(request, id, itemId);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id, itemId } = await params;
  return removePackageItem(request, id, itemId);
}
