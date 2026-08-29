import type { NextRequest } from "next/server";
import { updateDiscount, deleteDiscount } from "@/server/adminRoutes/pricingConfig";

/**
 * Real mount point for the single-Discount Admin API. All logic lives in
 * src/server/adminRoutes/pricingConfig.ts. Hard delete (not soft/archive)
 * — Discount rows are pure config, not customer-facing catalogue content,
 * same convention as PricingTier.
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updateDiscount(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return deleteDiscount(request, id);
}
