import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";

/**
 * Installation Rates + Pricing Audit Log Admin route handlers. Not mounted
 * yet — see products.ts's header comment for why and how to activate.
 */

const installationRateSchema = z.object({
  baseRatePerUnit: z.number().min(0),
  floorModifier: z.number().min(0),
  heightAccessModifier: z.number().min(0),
  conduitTrunkingModifier: z.number().min(0),
  existingVsNewCablingModifier: z.number().min(0),
  configurationFee: z.number().min(0),
  remoteViewSetupFee: z.number().min(0),
  minimumCharge: z.number().min(0),
});

const SERVICE_TYPES = ["CCTV", "ACCESS_CONTROL", "INTERCOM", "NETWORKING"] as const;

export async function listInstallationRates(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    return NextResponse.json({ rates: await container.installationRates.list() });
  });
}

export async function upsertInstallationRate(request: NextRequest, serviceType: string) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    if (!SERVICE_TYPES.includes(serviceType as (typeof SERVICE_TYPES)[number])) {
      return NextResponse.json({ error: "Unknown service type." }, { status: 400 });
    }
    const parsed = installationRateSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

    const rate = await container.installationRates.upsert(
      session.sub,
      serviceType as (typeof SERVICE_TYPES)[number],
      parsed.data
    );
    return NextResponse.json({ rate });
  });
}

export async function listRecentAuditLog(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "50");
    return NextResponse.json({ entries: await container.auditLog.listRecent(limit) });
  });
}

export async function listAuditLogForEntity(request: NextRequest, entityType: string, entityId: string) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    return NextResponse.json({ entries: await container.auditLog.listForEntity(entityType, entityId) });
  });
}
