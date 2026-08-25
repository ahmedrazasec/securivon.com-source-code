import type { NextRequest } from "next/server";
import { updatePricingTier, deletePricingTier } from "@/server/adminRoutes/pricingConfig";

/**
 * Real mount point for the single-PricingTier Admin API. All logic lives
 * in src/server/adminRoutes/pricingConfig.ts. Hard delete (not
 * soft/archive) — PricingTier rows are pure config, not customer-facing
 * catalogue content, and the schema has no deletedAt column for it.
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updatePricingTier(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return deletePricingTier(request, id);
}
