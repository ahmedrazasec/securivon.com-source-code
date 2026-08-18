import "server-only";

/**
 * Site-survey decision rule engine.
 *
 * Dedicated module per your instruction — this logic must live here, not
 * scattered through UI/configurator components. It decides whether the
 * configurator may show a priced estimate at all, or must route the
 * customer to Request Quote / Site Survey with no fabricated number.
 *
 * Configurable by design: SITE_SURVEY_RULES is an ordered list of pure
 * predicate rules, each returning a reason string when triggered. Adding,
 * removing, or tuning a rule (e.g. changing the "large camera count"
 * threshold) means editing this list — it does not require touching the
 * configurator UI or the pricing engine.
 *
 * Initial rule thresholds (camera count, floor count, cable-run length) are
 * reasonable starting defaults, NOT verified Securivon operating limits —
 * flagged for Ahmed's confirmation, consistent with every other "structure
 * before real numbers" decision in this project. See README "Known
 * limitations / open decisions."
 */

export interface SiteSurveyCheckInput {
  propertyType: "house" | "apartment" | "shop" | "office" | "restaurant" | "warehouse" | "other";
  cameraCount: number;
  floors: number;
  cableDistanceCategory: "short" | "medium" | "long";
  difficultAccess: boolean;
  selectedServiceIds: string[]; // e.g. ["fire", "intrusion"]
  hasVerifiedPricingForSelection: boolean; // set false if the pricing engine reported insufficientData
  customerRequestedSurvey: boolean;
}

export interface SiteSurveyCheckResult {
  required: boolean;
  reasons: string[];
}

const QUOTE_ONLY_SERVICE_IDS = new Set(["fire", "intrusion"]);

// Defaults — see module header. Not verified Securivon limits.
const LARGE_CAMERA_COUNT_THRESHOLD = 12;
const MULTI_FLOOR_THRESHOLD = 3;

type Rule = (input: SiteSurveyCheckInput) => string | null;

const SITE_SURVEY_RULES: Rule[] = [
  (i) => (i.propertyType === "warehouse" ? "Warehouse / industrial property." : null),
  (i) => (i.propertyType === "other" ? "Property type not specified as a standard category." : null),
  (i) =>
    i.floors >= MULTI_FLOOR_THRESHOLD
      ? `Multi-floor complex (${i.floors} floors) — beyond standard estimate coverage.`
      : null,
  (i) =>
    i.cameraCount >= LARGE_CAMERA_COUNT_THRESHOLD
      ? `Large camera count (${i.cameraCount}) — treated as a commercial-scale project.`
      : null,
  (i) =>
    i.cableDistanceCategory === "long" && i.difficultAccess
      ? "Long/complex cable run combined with difficult height/access." : null,
  (i) =>
    i.selectedServiceIds.some((id) => QUOTE_ONLY_SERVICE_IDS.has(id))
      ? "Fire alarm and/or intrusion systems are always quote-only, regardless of other answers."
      : null,
  (i) => (!i.hasVerifiedPricingForSelection ? "Missing verified product/pricing information for this configuration." : null),
  (i) => (i.customerRequestedSurvey ? "Customer explicitly requested a site survey." : null),
];

/**
 * Normal-estimate-eligible property types, per your instruction — kept as an
 * explicit allowlist so a new property type added later defaults to
 * "needs a rule reviewed," not silently to "eligible."
 */
const NORMAL_ESTIMATE_ELIGIBLE_PROPERTY_TYPES = new Set(["house", "apartment", "shop", "office", "restaurant"]);

export function checkSiteSurveyRequired(input: SiteSurveyCheckInput): SiteSurveyCheckResult {
  const reasons = SITE_SURVEY_RULES.map((rule) => rule(input)).filter(
    (r): r is string => r !== null
  );

  // Belt-and-suspenders: even with zero triggered rules, a property type
  // outside the explicit eligible set does not get a priced estimate.
  if (reasons.length === 0 && !NORMAL_ESTIMATE_ELIGIBLE_PROPERTY_TYPES.has(input.propertyType)) {
    reasons.push(`Property type "${input.propertyType}" is not on the normal-estimate-eligible list.`);
  }

  return {
    required: reasons.length > 0,
    reasons,
  };
}
