import type { NextRequest } from "next/server";
import { updatePackage, archivePackage } from "@/server/adminRoutes/packages";

/**
 * Real mount point for the single-Package Admin API. All logic lives in
 * src/server/adminRoutes/packages.ts.
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updatePackage(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return archivePackage(request, id);
}
