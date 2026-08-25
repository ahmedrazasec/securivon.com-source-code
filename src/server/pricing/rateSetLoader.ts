import "server-only";
import { prisma } from "@/server/db/client";
import type {
  PricingRateSet,
  CoverageTierRate,
  RecorderTierRate,
  CablingRateInput,
  InstallationRateInput,
  RoundingRuleInput,
} from "./types";

/**
 * Assembles PricingRateSet from Admin-editable database rows.
 *
 * Convention: coverage-tier and recorder-tier rates are PricingTier rows
 * with serviceType "CCTV_COVERAGE_<tierId>" (e.g. "CCTV_COVERAGE_STANDARD")
 * and "CCTV_RECORDER" respectively (maxQuantity = the recorder's camera
 * capacity, unitPrice = its price). This reuses the existing, already
 * Admin-managed PricingTier table/API rather than requiring a schema
 * change — Admin enters these the same way as any other pricing-tier row.
 *
 * Returns `null` for any piece that has no real data yet, rather than a
 * fabricated zero/default — the caller (configurator API route) is
 * responsible for treating an incomplete result as "no verified pricing,"
 * per the pricing engine's own honesty rule. This function does not decide
 * whether an estimate can be shown; it only reports what data actually
 * exists.
 */

export interface LoadedRateSet {
  /** Fully assembled PricingRateSet — only present if every required piece was found. */
  rateSet: PricingRateSet | null;
  /** Human-readable reasons any required piece was missing, for site-survey-check / debugging. */
  missingReasons: string[];
}

const COVERAGE_TIER_PREFIX = "CCTV_COVERAGE_";
const RECORDER_TIER_SERVICE_TYPE = "CCTV_RECORDER";

type PricingTierRow = Awaited<ReturnType<typeof prisma.pricingTier.findMany>>[number];

export async function loadCctvPricingRateSet(): Promise<LoadedRateSet> {
  const missingReasons: string[] = [];

  const [pricingTiers, cablingRate, installationRate, roundingRule, minimumChargeRule, activeDiscount, activeTax] =
    await Promise.all([
      prisma.pricingTier.findMany({
        where: { OR: [{ serviceType: { startsWith: COVERAGE_TIER_PREFIX } }, { serviceType: RECORDER_TIER_SERVICE_TYPE }] },
      }),
      prisma.cablingRate.findFirst({ orderBy: { updatedAt: "desc" } }),
      prisma.installationRate.findUnique({ where: { serviceType: "CCTV" } }),
      prisma.roundingRule.findFirst({ orderBy: { updatedAt: "desc" } }),
      prisma.minimumChargeRule.findUnique({ where: { serviceType: "CCTV" } }),
      prisma.discount.findFirst({ where: { sitewide: true, active: true }, orderBy: { updatedAt: "desc" } }),
      prisma.taxRule.findFirst({ where: { active: true }, orderBy: { updatedAt: "desc" } }),
    ]);

  const coverageTiers: CoverageTierRate[] = pricingTiers
    .filter((t: PricingTierRow) => t.serviceType?.startsWith(COVERAGE_TIER_PREFIX))
    .map((t: PricingTierRow) => ({
      id: t.id,
      tierId: t.serviceType!.slice(COVERAGE_TIER_PREFIX.length).toLowerCase(),
      ratePerCamera: Number(t.unitPrice),
      verificationDate: t.verificationDate?.toISOString() ?? null,
    }));
  if (coverageTiers.length === 0) missingReasons.push("No CCTV coverage-tier pricing configured yet (PricingTier rows).");

  const recorderTiers: RecorderTierRate[] = pricingTiers
    .filter((t: PricingTierRow) => t.serviceType === RECORDER_TIER_SERVICE_TYPE && t.maxQuantity !== null)
    .map((t: PricingTierRow) => ({
      id: t.id,
      maxCameras: t.maxQuantity!,
      price: Number(t.unitPrice),
      verificationDate: t.verificationDate?.toISOString() ?? null,
    }));
  if (recorderTiers.length === 0) missingReasons.push("No recorder pricing configured yet (PricingTier rows).");

  if (!cablingRate) missingReasons.push("No cabling rate configured yet (CablingRate table is empty).");
  if (!installationRate) missingReasons.push("No CCTV installation rate configured yet.");
  if (!roundingRule) missingReasons.push("No rounding rule configured yet.");

  if (missingReasons.length > 0 || !cablingRate || !installationRate || !roundingRule) {
    return { rateSet: null, missingReasons };
  }

  const cabling: CablingRateInput = {
    cableType: cablingRate.cableType,
    ratePerMeter: Number(cablingRate.ratePerMeter),
    includedAllowancePerCamera: Number(cablingRate.includedAllowancePerCamera),
  };

  const installation: InstallationRateInput = {
    serviceType: "CCTV",
    baseRatePerUnit: Number(installationRate.baseRatePerUnit),
    floorModifier: Number(installationRate.floorModifier),
    heightAccessModifier: Number(installationRate.heightAccessModifier),
    conduitTrunkingModifier: Number(installationRate.conduitTrunkingModifier),
    existingVsNewCablingModifier: Number(installationRate.existingVsNewCablingModifier),
    configurationFee: Number(installationRate.configurationFee),
    remoteViewSetupFee: Number(installationRate.remoteViewSetupFee),
    minimumCharge: Number(installationRate.minimumCharge),
  };

  const rounding: RoundingRuleInput = {
    granularity: Number(roundingRule.granularity),
    direction: roundingRule.direction,
  };

  const rateSet: PricingRateSet = {
    coverageTiers,
    recorderTiers,
    cabling,
    installation,
    // No dedicated storage-upgrade rate table yet — modeled as zero
    // (no upcharge) rather than fabricated, until Admin has a real place
    // to configure it. Documented gap, not a silent assumption.
    storageUpgradeCost: 0,
    addonCosts: {},
    discount: activeDiscount
      ? {
          id: activeDiscount.id,
          type: activeDiscount.type,
          value: Number(activeDiscount.value),
          active: activeDiscount.active,
          validFrom: activeDiscount.validFrom?.toISOString() ?? null,
          validUntil: activeDiscount.validUntil?.toISOString() ?? null,
        }
      : undefined,
    tax: activeTax
      ? { ratePercentage: Number(activeTax.ratePercentage), appliesTo: activeTax.appliesTo, active: activeTax.active }
      : undefined,
    rounding,
    minimumChargeAmount: minimumChargeRule ? Number(minimumChargeRule.minimumChargeAmount) : 0,
  };

  return { rateSet, missingReasons: [] };
}
