import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";

/**
 * Pricing-config Admin route handlers — PricingTier, CablingRate,
 * RoundingRule. See src/server/services/pricingConfigService.ts for why
 * these three specifically (the actual blockers on a real Configurator
 * estimate, per src/server/pricing/rateSetLoader.ts).
 *
 * Mounted at src/app/api/admin/pricing-tiers/route.ts + .../[id]/route.ts,
 * src/app/api/admin/cabling-rate/route.ts, and
 * src/app/api/admin/rounding-rule/route.ts — those files re-export/adapt
 * the functions below rather than duplicating logic.
 */

const COVERAGE_TIER_PREFIX = "CCTV_COVERAGE_";
const RECORDER_SERVICE_TYPE = "CCTV_RECORDER";

// Enforces the naming convention the rate-set loader depends on, so Admin
// can't accidentally create an unusable row (e.g. a typo'd serviceType
// that silently never gets picked up by the Configurator).
const pricingTierServiceType = z
  .string()
  .refine(
    (v) => v === RECORDER_SERVICE_TYPE || v.startsWith(COVERAGE_TIER_PREFIX),
    `serviceType must be "${RECORDER_SERVICE_TYPE}" or start with "${COVERAGE_TIER_PREFIX}" (e.g. "${COVERAGE_TIER_PREFIX}STANDARD").`
  );

const pricingTierCreateSchema = z.object({
  serviceType: pricingTierServiceType,
  minQuantity: z.number().int().min(0),
  maxQuantity: z.number().int().min(1).nullable(),
  unitPrice: z.number().min(0),
  verificationDate: z.string().nullable().default(null),
});
const pricingTierUpdateSchema = pricingTierCreateSchema.partial();

const cablingRateSchema = z.object({
  cableType: z.string().min(1).max(100),
  ratePerMeter: z.number().min(0),
  includedAllowancePerCamera: z.number().min(0),
});

const roundingRuleSchema = z.object({
  granularity: z.number().positive(),
  direction: z.enum(["NEAREST", "UP", "DOWN"]),
});

export async function listPricingTiers(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    return NextResponse.json({ tiers: await container.pricingConfig.listPricingTiers() });
  });
}

export async function createPricingTier(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    const parsed = pricingTierCreateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    const tier = await container.pricingConfig.createPricingTier(session.sub, parsed.data);
    return NextResponse.json({ tier }, { status: 201 });
  });
}

export async function updatePricingTier(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    const parsed = pricingTierUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    const tier = await container.pricingConfig.updatePricingTier(session.sub, id, parsed.data);
    return NextResponse.json({ tier });
  });
}

export async function deletePricingTier(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    await container.pricingConfig.deletePricingTier(session.sub, id);
    return NextResponse.json({ ok: true });
  });
}

export async function getCablingRate(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    return NextResponse.json({ rate: await container.pricingConfig.getCablingRate() });
  });
}

export async function upsertCablingRate(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    const parsed = cablingRateSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    const rate = await container.pricingConfig.upsertCablingRate(session.sub, parsed.data);
    return NextResponse.json({ rate });
  });
}

export async function getRoundingRule(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    return NextResponse.json({ rule: await container.pricingConfig.getRoundingRule() });
  });
}

export async function upsertRoundingRule(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    const parsed = roundingRuleSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    const rule = await container.pricingConfig.upsertRoundingRule(session.sub, parsed.data);
    return NextResponse.json({ rule });
  });
}
