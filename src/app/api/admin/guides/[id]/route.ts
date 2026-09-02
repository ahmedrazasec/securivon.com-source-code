import type { NextRequest } from "next/server";
import { updateGuide, archiveGuide } from "@/server/adminRoutes/catalogueSupport";

/**
 * Real mount point for the single-Guide Admin API. All logic lives in
 * src/server/adminRoutes/catalogueSupport.ts. DELETE maps to archiveGuide
 * (status -> "ARCHIVED", the same soft-delete convention every other
 * catalogue entity uses — no hard delete).
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updateGuide(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return archiveGuide(request, id);
}
