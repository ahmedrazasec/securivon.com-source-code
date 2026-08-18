import "server-only";

/**
 * Pricing engine types.
 *
 * These mirror the Admin-editable rate records defined in prisma/schema.prisma
 * (PricingTier, CablingRate, InstallationRate, MinimumChargeRule, Discount,
 * TaxRule, RoundingRule) but are declared independently here so the engine
 * itself (engine.ts) never needs to import the Prisma client or know how
 * rates are fetched — it only needs these plain shapes. The repository layer
 * (src/server/repositories/*) is responsible for loading real rows from the
 * database and mapping them onto these types.
 */

export type PriceType = "FIXED" | "STARTING_FROM" | "RANGE" | "ESTIMATED" | "QUOTE_ONLY";

export interface CoverageTierRate {
  id: string;
  /** e.g. "standard" | "high" | "wide" — matches Product.configuratorTags conventions */
  tierId: string;
  ratePerCamera: number;
  verificationDate: string | null;
}

export interface RecorderTierRate {
  id: string;
  maxCameras: number;
  price: number;
  verificationDate: string | null;
}

export interface CablingRateInput {
  cableType: string;
  ratePerMeter: number;
  includedAllowancePerCamera: number;
}

export interface InstallationRateInput {
  serviceType: "CCTV" | "ACCESS_CONTROL" | "INTERCOM" | "NETWORKING";
  baseRatePerUnit: number;
  floorModifier: number;
  heightAccessModifier: number;
  conduitTrunkingModifier: number;
  existingVsNewCablingModifier: number;
  configurationFee: number;
  remoteViewSetupFee: number;
  minimumCharge: number;
}

export interface DiscountInput {
  id: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  active: boolean;
  validFrom: string | null;
  validUntil: string | null;
}

export interface TaxRuleInput {
  ratePercentage: number;
  appliesTo: "HARDWARE" | "INSTALLATION" | "ALL";
  active: boolean;
}

export interface RoundingRuleInput {
  granularity: number;
  direction: "NEAREST" | "UP" | "DOWN";
}

/** All rate data the engine needs for one calculation — assembled by the repository layer. */
export interface PricingRateSet {
  coverageTiers: CoverageTierRate[];
  recorderTiers: RecorderTierRate[];
  cabling: CablingRateInput;
  installation: InstallationRateInput;
  storageUpgradeCost: number;
  addonCosts: Record<string, { cost: number | null; quoteOnly: boolean }>;
  discount?: DiscountInput;
  tax?: TaxRuleInput;
  rounding: RoundingRuleInput;
  minimumChargeAmount: number;
}

export interface PricingEstimateInput {
  coverageTierId: string;
  cameraCount: number;
  storageTierId: "2w" | "4w" | "1m";
  addonIds: string[];
  floors: number;
  cableDistanceCategory: "short" | "medium" | "long";
  cableDistanceMetersPerCamera: Record<"short" | "medium" | "long", number>;
  difficultAccess: boolean;
  needsConduitTrunking: boolean;
  isNewCabling: boolean;
  wantsRemoteViewSetup: boolean;
}

export interface PricingLineBreakdown {
  hardware: number;
  accessories: number;
  cabling: number;
  installation: number;
  configuration: number;
  delivery: number;
  optionalUpgrades: number;
  discountApplied: number;
  taxApplied: number;
}

export interface PricingEstimateResult {
  priceType: PriceType;
  low: number | null;
  high: number | null;
  breakdown: PricingLineBreakdown;
  hasQuoteOnlyAddon: boolean;
  quoteOnlyAddonIds: string[];
  /** True when the rate set is incomplete/unverified and the engine could not produce a real number. */
  insufficientData: boolean;
  insufficientDataReasons: string[];
}
