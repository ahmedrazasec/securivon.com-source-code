import type { NextRequest } from "next/server";
import { listAuditLogForEntity } from "@/server/adminRoutes/pricing";

/**
 * Real mount point for the per-entity Pricing Audit Log Admin API. All
 * logic lives in src/server/adminRoutes/pricing.ts — this file only
 * adapts Next.js's async route params to that handler's
 * (request, entityType, entityId) signature.
 */
type RouteParams = { params: Promise<{ entityType: string; entityId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { entityType, entityId } = await params;
  return listAuditLogForEntity(request, entityType, entityId);
}
