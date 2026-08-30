import type { NextRequest } from "next/server";
import { updateService, archiveService } from "@/server/adminRoutes/catalogueSupport";

/**
 * Real mount point for the single-Service Admin API. All logic lives in
 * src/server/adminRoutes/catalogueSupport.ts. DELETE maps to
 * archiveService (status -> "ARCHIVED", the same soft-delete convention
 * Package uses — no hard delete).
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updateService(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return archiveService(request, id);
}
