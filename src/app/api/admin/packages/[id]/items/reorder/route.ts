import type { NextRequest } from "next/server";
import { reorderPackageItems } from "@/server/adminRoutes/packages";

/**
 * Real mount point for reordering Package Items. All logic lives in
 * src/server/adminRoutes/packages.ts. Deliberately a literal "reorder"
 * segment, sibling to items/[itemId]/route.ts — Next.js resolves the
 * literal match ahead of the dynamic one, so this doesn't conflict with
 * an actual itemId that happened to be the string "reorder" (item IDs are
 * cuids, never that).
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return reorderPackageItems(request, id);
}
