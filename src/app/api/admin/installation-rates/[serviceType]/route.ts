import type { NextRequest } from "next/server";
import { upsertInstallationRate } from "@/server/adminRoutes/pricing";

/**
 * Real mount point for the single-InstallationRate Admin API. All logic
 * lives in src/server/adminRoutes/pricing.ts. PATCH maps to
 * upsertInstallationRate — there are exactly four fixed service-type rows
 * (CCTV/ACCESS_CONTROL/INTERCOM/NETWORKING per the schema enum), each
 * created implicitly on first upsert rather than via a separate POST/create
 * step, matching the handler's own validated-service-type + partial-update
 * design.
 */
type RouteParams = { params: Promise<{ serviceType: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { serviceType } = await params;
  return upsertInstallationRate(request, serviceType);
}
