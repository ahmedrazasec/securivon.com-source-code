import type { NextRequest } from "next/server";
import { upsertMinimumChargeRule } from "@/server/adminRoutes/pricingConfig";

/**
 * Real mount point for the single-MinimumChargeRule Admin API. All logic
 * lives in src/server/adminRoutes/pricingConfig.ts. PATCH maps to
 * upsertMinimumChargeRule — same "fixed set of service types, created
 * implicitly on first upsert" design as installation-rates/[serviceType].
 */
type RouteParams = { params: Promise<{ serviceType: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { serviceType } = await params;
  return upsertMinimumChargeRule(request, serviceType);
}
