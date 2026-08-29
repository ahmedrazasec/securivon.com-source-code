import type { NextRequest } from "next/server";
import { updateTaxRule, deleteTaxRule } from "@/server/adminRoutes/pricingConfig";

/**
 * Real mount point for the single-TaxRule Admin API. All logic lives in
 * src/server/adminRoutes/pricingConfig.ts. Hard delete (not soft/archive)
 * — TaxRule rows are pure config, same convention as PricingTier/Discount.
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updateTaxRule(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return deleteTaxRule(request, id);
}
