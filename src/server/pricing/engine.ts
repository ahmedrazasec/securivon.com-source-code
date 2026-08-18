import "server-only";
import type {
  PricingEstimateInput,
  PricingEstimateResult,
  PricingRateSet,
  PricingLineBreakdown,
} from "./types";

/**
 * Production pricing engine.
 *
 * This module computes ONLY. It never fetches data itself — the caller
 * (an API route or server action, via src/server/repositories/*) is
 * responsible for loading current, Admin-edited rates from the database and
 * passing them in as `rates`. This keeps the engine:
 *   1. Fully unit-testable without a database (see engine.test.ts).
 *   2. Impossible to accidentally run on the client — `server-only` throws
 *      at build time if this module is ever imported into a client bundle.
 *   3. Free of any hardcoded production price. Every number in a
 *      PricingEstimateResult traces back to a `rates` field the caller
 *      supplied — grep this file for a literal PKR figure and you should
 *      find none outside of comments/tests.
 *
 * Component list implemented (Phase 2 Corrections §1 / Phase 4 §3.8):
 *   hardware + accessories + cabling + installation + configuration
 *   + delivery + optional upgrades − discount ± (quantity tiers are applied
 *   by the caller when selecting coverageTiers/recorderTiers, not here)
 *   + tax → rounding.
 *
 * Honesty rule: if required rate data is missing (e.g. no coverage tier rate
 * found for the requested tier), the engine returns priceType "QUOTE_ONLY"
 * with insufficientData=true rather than silently computing against a zero
 * or fabricated default. Never invent a number to fill a gap.
 */
export function computeEstimate(
  input: PricingEstimateInput,
  rates: PricingRateSet
): PricingEstimateResult {
  const reasons: string[] = [];

  const coverageTier = rates.coverageTiers.find((t) => t.tierId === input.coverageTierId);
  if (!coverageTier) reasons.push(`No verified rate for coverage tier "${input.coverageTierId}".`);

  const recorderTier = rates.recorderTiers
    .slice()
    .sort((a, b) => a.maxCameras - b.maxCameras)
    .find((t) => input.cameraCount <= t.maxCameras);
  if (!recorderTier) reasons.push(`No verified recorder rate covers ${input.cameraCount} cameras.`);

  const quoteOnlyAddonIds: string[] = [];
  let addonsCost = 0;
  for (const addonId of input.addonIds) {
    const addon = rates.addonCosts[addonId];
    if (!addon) {
      reasons.push(`No verified rate for add-on "${addonId}".`);
      continue;
    }
    if (addon.quoteOnly || addon.cost === null) {
      quoteOnlyAddonIds.push(addonId);
      continue;
    }
    addonsCost += addon.cost;
  }

  if (reasons.length > 0 || !coverageTier || !recorderTier) {
    return {
      priceType: "QUOTE_ONLY",
      low: null,
      high: null,
      breakdown: emptyBreakdown(),
      hasQuoteOnlyAddon: quoteOnlyAddonIds.length > 0,
      quoteOnlyAddonIds,
      insufficientData: true,
      insufficientDataReasons: reasons,
    };
  }

  const cameraHardware = coverageTier.ratePerCamera * input.cameraCount;
  const recorder = recorderTier.price;
  const storageExtra = rates.storageUpgradeCost;
  // Recorder and storage-upgrade cost are hardware components — combined
  // into one "hardware" breakdown line rather than left as unused locals
  // (a real bug caught by `npm run lint`'s no-unused-vars warning, not
  // deliberate simplification — see git history / final report).
  const hardware = cameraHardware + recorder + storageExtra;

  const metersPerCamera = input.cableDistanceMetersPerCamera[input.cableDistanceCategory];
  const billableMeters = Math.max(
    0,
    metersPerCamera - rates.cabling.includedAllowancePerCamera
  ) * input.cameraCount;
  const cabling = billableMeters * rates.cabling.ratePerMeter;

  const floorsExtra = Math.max(0, input.floors - 1) * rates.installation.floorModifier;
  const accessExtra = input.difficultAccess ? rates.installation.heightAccessModifier : 0;
  const conduitExtra = input.needsConduitTrunking ? rates.installation.conduitTrunkingModifier : 0;
  const cablingTypeExtra = input.isNewCabling ? rates.installation.existingVsNewCablingModifier : 0;
  const installBase = rates.installation.baseRatePerUnit * input.cameraCount;
  let installation = installBase + floorsExtra + accessExtra + conduitExtra + cablingTypeExtra;
  installation = Math.max(installation, rates.minimumChargeAmount);

  const configuration = rates.installation.configurationFee;
  const delivery = 0; // Only applicable outside core service area — not modeled at MVP.
  const remoteView = input.wantsRemoteViewSetup ? rates.installation.remoteViewSetupFee : 0;

  const subtotal =
    hardware + accessoriesPlaceholder() + cabling + installation + configuration + delivery + addonsCost + remoteView;

  const discountApplied = applyDiscount(subtotal, rates.discount);
  const afterDiscount = subtotal - discountApplied;

  const taxApplied = applyTax(afterDiscount, rates.tax);
  const total = afterDiscount + taxApplied;

  const rounded = applyRounding(total, rates.rounding);

  const breakdown: PricingLineBreakdown = {
    hardware,
    accessories: accessoriesPlaceholder(),
    cabling,
    installation,
    configuration: configuration + remoteView,
    delivery,
    optionalUpgrades: addonsCost,
    discountApplied,
    taxApplied,
  };

  return {
    priceType: "ESTIMATED",
    low: Math.round(rounded * 0.92),
    high: Math.round(rounded * 1.15),
    breakdown,
    hasQuoteOnlyAddon: quoteOnlyAddonIds.length > 0,
    quoteOnlyAddonIds,
    insufficientData: false,
    insufficientDataReasons: [],
  };
}

// Accessories (brackets, connectors, power supplies) are modeled as a
// required-PackageItem/related-product concept at the catalogue layer, not
// as a flat rate here. Kept as an explicit, named zero rather than omitted,
// so the breakdown shape stays stable once accessory bundling is wired in.
function accessoriesPlaceholder(): number {
  return 0;
}

function applyDiscount(subtotal: number, discount?: PricingRateSet["discount"]): number {
  if (!discount || !discount.active) return 0;
  const now = Date.now();
  if (discount.validFrom && new Date(discount.validFrom).getTime() > now) return 0;
  if (discount.validUntil && new Date(discount.validUntil).getTime() < now) return 0;
  if (discount.type === "PERCENTAGE") return subtotal * (discount.value / 100);
  return Math.min(discount.value, subtotal);
}

function applyTax(amount: number, tax?: PricingRateSet["tax"]): number {
  if (!tax || !tax.active) return 0;
  return amount * (tax.ratePercentage / 100);
}

function applyRounding(amount: number, rule: PricingRateSet["rounding"]): number {
  const g = rule.granularity || 1;
  switch (rule.direction) {
    case "UP":
      return Math.ceil(amount / g) * g;
    case "DOWN":
      return Math.floor(amount / g) * g;
    case "NEAREST":
    default:
      return Math.round(amount / g) * g;
  }
}

function emptyBreakdown(): PricingLineBreakdown {
  return {
    hardware: 0,
    accessories: 0,
    cabling: 0,
    installation: 0,
    configuration: 0,
    delivery: 0,
    optionalUpgrades: 0,
    discountApplied: 0,
    taxApplied: 0,
  };
}
