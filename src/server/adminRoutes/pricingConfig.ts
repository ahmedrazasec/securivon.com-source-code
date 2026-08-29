import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/server/auth/adminApiHelper";
import { container } from "@/server/container";

/**
 * Pricing-config Admin route handlers — PricingTier, CablingRate,
 * RoundingRule, Discount, TaxRule, MinimumChargeRule. See
 * src/server/services/pricingConfigService.ts for why PricingTier/
 * CablingRate/RoundingRule are the actual blockers on a real Configurator
 * estimate (per src/server/pricing/rateSetLoader.ts) while Discount/
 * TaxRule/MinimumChargeRule are optional-with-safe-fallback.
 *
 * Mounted at src/app/api/admin/pricing-tiers/route.ts + .../[id]/route.ts,
 * src/app/api/admin/cabling-rate/route.ts,
 * src/app/api/admin/rounding-rule/route.ts,
 * src/app/api/admin/discounts/route.ts + .../[id]/route.ts,
 * src/app/api/admin/tax-rules/route.ts + .../[id]/route.ts, and
 * src/app/api/admin/minimum-charge-rules/route.ts + .../[serviceType]/route.ts
 * — those files re-export/adapt the functions below rather than
 * duplicating logic.
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

// Same rationale as installation-rates: restrict serviceType to the fixed
// set the rate-set loader actually reads from, so Admin can't create an
// unusable row via a typo (only "CCTV" is wired into the Configurator
// today — see MinimumChargeRuleRepository's doc comment in types.ts).
const MINIMUM_CHARGE_SERVICE_TYPES = ["CCTV", "ACCESS_CONTROL", "INTERCOM", "NETWORKING"] as const;

const isoDateString = z
  .string()
  .nullable()
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Must be a valid date/time or null.");

// Base shape shared by create and update — cross-field checks (percentage
// bound, validFrom/validUntil ordering) are applied via superRefine on
// both, rather than chaining .refine() before .partial() (which Zod
// doesn't support directly on a ZodEffects).
const discountBaseSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.number().min(0),
  appliesToPackageId: z.string().nullable(),
  appliesToCategoryId: z.string().nullable(),
  sitewide: z.boolean(),
  validFrom: isoDateString,
  validUntil: isoDateString,
  active: z.boolean(),
});

function checkDiscountCrossFields(
  v: { type?: "PERCENTAGE" | "FIXED_AMOUNT"; value?: number; validFrom?: string | null; validUntil?: string | null },
  ctx: z.RefinementCtx
) {
  if (v.type === "PERCENTAGE" && v.value !== undefined && v.value > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A percentage discount cannot exceed 100.", path: ["value"] });
  }
  if (v.validFrom && v.validUntil && new Date(v.validFrom) > new Date(v.validUntil)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "validFrom must be before validUntil.", path: ["validUntil"] });
  }
}

const discountCreateSchema = discountBaseSchema
  .extend({
    appliesToPackageId: z.string().nullable().default(null),
    appliesToCategoryId: z.string().nullable().default(null),
    sitewide: z.boolean().default(false),
    validFrom: isoDateString.default(null),
    validUntil: isoDateString.default(null),
    active: z.boolean().default(false),
  })
  .superRefine(checkDiscountCrossFields);
const discountUpdateSchema = discountBaseSchema.partial().superRefine(checkDiscountCrossFields);

const taxRuleCreateSchema = z.object({
  name: z.string().min(1).max(200),
  ratePercentage: z.number().min(0).max(100),
  appliesTo: z.enum(["HARDWARE", "INSTALLATION", "ALL"]).default("ALL"),
  inclusiveOrExclusive: z.enum(["INCLUSIVE", "EXCLUSIVE", "UNSTATED"]).default("UNSTATED"),
  active: z.boolean().default(false),
});
const taxRuleUpdateSchema = taxRuleCreateSchema.partial();

const minimumChargeRuleSchema = z.object({
  minimumChargeAmount: z.number().min(0),
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

// ----------------------------------------------------------------------
// Discount
// ----------------------------------------------------------------------

export async function listDiscounts(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    return NextResponse.json({ discounts: await container.pricingConfig.listDiscounts() });
  });
}

export async function createDiscount(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    const parsed = discountCreateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    const discount = await container.pricingConfig.createDiscount(session.sub, parsed.data);
    return NextResponse.json({ discount }, { status: 201 });
  });
}

export async function updateDiscount(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    const parsed = discountUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    const discount = await container.pricingConfig.updateDiscount(session.sub, id, parsed.data);
    return NextResponse.json({ discount });
  });
}

export async function deleteDiscount(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    await container.pricingConfig.deleteDiscount(session.sub, id);
    return NextResponse.json({ ok: true });
  });
}

// ----------------------------------------------------------------------
// TaxRule
// ----------------------------------------------------------------------

export async function listTaxRules(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    return NextResponse.json({ taxRules: await container.pricingConfig.listTaxRules() });
  });
}

export async function createTaxRule(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    const parsed = taxRuleCreateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    const taxRule = await container.pricingConfig.createTaxRule(session.sub, parsed.data);
    return NextResponse.json({ taxRule }, { status: 201 });
  });
}

export async function updateTaxRule(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    const parsed = taxRuleUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    const taxRule = await container.pricingConfig.updateTaxRule(session.sub, id, parsed.data);
    return NextResponse.json({ taxRule });
  });
}

export async function deleteTaxRule(request: NextRequest, id: string) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    await container.pricingConfig.deleteTaxRule(session.sub, id);
    return NextResponse.json({ ok: true });
  });
}

// ----------------------------------------------------------------------
// MinimumChargeRule
// ----------------------------------------------------------------------

export async function listMinimumChargeRules(request: NextRequest) {
  return withAdminAuth(request, "EDIT_PRICING", async () => {
    return NextResponse.json({ rules: await container.pricingConfig.listMinimumChargeRules() });
  });
}

export async function upsertMinimumChargeRule(request: NextRequest, serviceType: string) {
  return withAdminAuth(request, "EDIT_PRICING", async (session) => {
    if (!MINIMUM_CHARGE_SERVICE_TYPES.includes(serviceType as (typeof MINIMUM_CHARGE_SERVICE_TYPES)[number])) {
      return NextResponse.json({ error: "Unknown service type." }, { status: 400 });
    }
    const parsed = minimumChargeRuleSchema.partial().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
    const rule = await container.pricingConfig.upsertMinimumChargeRule(session.sub, serviceType, parsed.data);
    return NextResponse.json({ rule });
  });
}
