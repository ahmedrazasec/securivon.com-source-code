import type { NextRequest } from "next/server";
import { addPackageItem } from "@/server/adminRoutes/packages";

/**
 * Real mount point for adding a Package Item. All logic lives in
 * src/server/adminRoutes/packages.ts.
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return addPackageItem(request, id);
}
