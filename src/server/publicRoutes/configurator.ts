import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { computeEstimate } from "@/server/pricing/engine";
import { loadCctvPricingRateSet } from "@/server/pricing/rateSetLoader";
import { checkSiteSurveyRequired } from "@/server/siteSurvey/rules";
import type { PricingEstimateInput } from "@/server/pricing/types";
import type { SiteSurveyCheckInput } from "@/server/siteSurvey/rules";

/**
 * Public Configurator estimate endpoint.
 *
 * Real wiring, not a mock: runs the actual Stage 1 pricing engine
 * (src/server/pricing/engine.ts) and site-survey rule engine
 * (src/server/siteSurvey/rules.ts) against real Admin-configured rates
 * (src/server/pricing/rateSetLoader.ts) — no client-side price
 * calculation, per project rules.
 *
 * CURRENT STATE (be honest about this, don't let the code's realism imply
 * otherwise): no coverage-tier, recorder-tier, cabling-rate, or
 * rounding-rule data has been entered by Admin yet, and there is currently
 * no Admin UI to enter PricingTier/CablingRate/Discount/TaxRule/
 * RoundingRule rows (only InstallationRate has Admin CRUD so far). So
 * every real request today will correctly resolve to
 * siteSurveyRequired=true with "no verified pricing" as one of the
 * reasons — that's the pricing engine's own honesty rule working exactly
 * as designed, not a bug in this endpoint. It will start producing real
 * ESTIMATED results automatically once that Admin data exists — no code
 * changes needed here when it does.
 */

const PROPERTY_TYPES = ["house", "apartment", "shop", "office", "restaurant", "warehouse", "other"] as const;
const CABLE_DISTANCE_CATEGORIES = ["short", "medium", "long"] as const;
const STORAGE_TIERS = ["2w", "4w", "1m"] as const;
const OPTIONAL_SERVICE_IDS = ["fire", "intrusion"] as const;

// Documented modeling assumption (same pattern as engine.ts's
// MOTION_DETECTION_FRACTION) — typical cable run length per category, not
// a price. Recalibrate once Securivon has real installation data.
const CABLE_METERS_PER_CAMERA: Record<(typeof CABLE_DISTANCE_CATEGORIES)[number], number> = {
  short: 10,
  medium: 25,
  long: 50,
};

const configuratorInputSchema = z.object({
  propertyType: z.enum(PROPERTY_TYPES),
  cameraCount: z.coerce.number().int().min(1).max(200),
  coverageTierId: z.enum(["standard", "wide", "high"]),
  storageTierId: z.enum(STORAGE_TIERS),
  floors: z.coerce.number().int().min(1).max(50),
  cableDistanceCategory: z.enum(CABLE_DISTANCE_CATEGORIES),
  difficultAccess: z.boolean(),
  needsConduitTrunking: z.boolean(),
  isNewCabling: z.boolean(),
  wantsRemoteViewSetup: z.boolean(),
  optionalServiceIds: z.array(z.enum(OPTIONAL_SERVICE_IDS)).default([]),
  customerRequestedSurvey: z.boolean().default(false),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = configuratorInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const answers = parsed.data;

  try {
    const { rateSet, missingReasons } = await loadCctvPricingRateSet();

    let estimate = null;
    let hasVerifiedPricingForSelection = rateSet !== null;

    if (rateSet) {
      const pricingInput: PricingEstimateInput = {
        coverageTierId: answers.coverageTierId,
        cameraCount: answers.cameraCount,
        storageTierId: answers.storageTierId,
        addonIds: [],
        floors: answers.floors,
        cableDistanceCategory: answers.cableDistanceCategory,
        cableDistanceMetersPerCamera: CABLE_METERS_PER_CAMERA,
        difficultAccess: answers.difficultAccess,
        needsConduitTrunking: answers.needsConduitTrunking,
        isNewCabling: answers.isNewCabling,
        wantsRemoteViewSetup: answers.wantsRemoteViewSetup,
      };
      estimate = computeEstimate(pricingInput, rateSet);
      hasVerifiedPricingForSelection = !estimate.insufficientData;
    }

    const surveyInput: SiteSurveyCheckInput = {
      propertyType: answers.propertyType,
      cameraCount: answers.cameraCount,
      floors: answers.floors,
      cableDistanceCategory: answers.cableDistanceCategory,
      difficultAccess: answers.difficultAccess,
      selectedServiceIds: answers.optionalServiceIds,
      hasVerifiedPricingForSelection,
      customerRequestedSurvey: answers.customerRequestedSurvey,
    };
    const surveyCheck = checkSiteSurveyRequired(surveyInput);

    const siteSurveyRequired = surveyCheck.required;
    const reasons = [...surveyCheck.reasons, ...(rateSet ? [] : missingReasons)];

    const computedResult = siteSurveyRequired
      ? { siteSurveyRequired: true, reasons }
      : { siteSurveyRequired: false, estimate };

    type ConfiguratorSessionCreateData = Parameters<typeof prisma.configuratorSession.create>[0]["data"];

    const session = await prisma.configuratorSession.create({
      data: {
        propertyType: answers.propertyType,
        answers: answers,
        computedResult: computedResult as ConfiguratorSessionCreateData["computedResult"],
        isConsultative: siteSurveyRequired,
      },
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        siteSurveyRequired,
        reasons: siteSurveyRequired ? reasons : [],
        estimate: siteSurveyRequired ? null : estimate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[configurator-error]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or contact us on WhatsApp." },
      { status: 500 }
    );
  }
}
