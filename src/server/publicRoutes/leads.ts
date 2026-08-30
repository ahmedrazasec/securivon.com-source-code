import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { HONEYPOT_FIELD_NAME, honeypotFieldSchema, isHoneypotTriggered } from "@/server/security/honeypot";

/**
 * Public "Request a Quote" lead capture.
 *
 * This is the direct-contact fallback path from the approved architecture
 * (Configurator → Quote Result → Request Quote/Site Survey, with Request
 * Quote also reachable directly from nav) — NOT the Configurator itself.
 * Without a configurator to compute an instant estimate, every submission
 * here honestly becomes a site-survey/callback request rather than a fake
 * on-the-spot price. The Configurator (a separate, larger Stage 3 piece)
 * is where the real estimate-vs-survey rule engine
 * (src/server/siteSurvey/rules.ts) gets exercised.
 *
 * Stage 3C — Configurator continuity: if `configuratorSessionId` is
 * provided (the customer arrived here via "Request Final Quote"/"Book
 * Site Survey" on their Configurator result), this:
 *   1. Links SiteSurveyRequest.configurationReference to that session
 *      (the schema field exists exactly for this).
 *   2. Sets ConfiguratorSession.leadId once a Lead exists — sessions are
 *      deliberately NOT identity-linked before this point (privacy
 *      boundary, per the model's own schema comment).
 *   3. Creates a real, persisted Quote (type=CONFIGURATOR_ESTIMATE) with
 *      configurationSnapshot/pricingRulesSnapshot frozen at submission
 *      time — so later Admin pricing changes never silently alter a
 *      quote a customer already received. If the session had a real
 *      priced estimate (not a site-survey routing), one CUSTOM_LINE
 *      QuoteItem captures it; QuoteItemType has no natural
 *      product/package to attach to here since the Configurator computes
 *      from coverage/recorder tiers, not a specific catalogue item.
 * A missing or invalid session ID never fails the submission — the
 * customer's contact request is what matters; the linkage is a bonus.
 *
 * KNOWN LIMITATION: no rate limiting yet (spam is mitigated via the
 * honeypot field below, not throttling — see src/server/security/honeypot.ts).
 * Fine for initial launch; revisit if abuse patterns emerge that a
 * honeypot alone doesn't catch.
 */

const PROPERTY_TYPES = ["HOME", "APARTMENT", "SHOP", "RESTAURANT", "OFFICE", "WAREHOUSE", "OTHER"] as const;

const requestQuoteSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  propertyType: z.enum(PROPERTY_TYPES),
  location: z.string().trim().min(2).max(200),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  configuratorSessionId: z.string().trim().optional(),
  [HONEYPOT_FIELD_NAME]: honeypotFieldSchema,
});

type StoredComputedResult = {
  siteSurveyRequired?: boolean;
  estimate?: { low: number; high: number } | null;
  pricingRulesSnapshot?: unknown;
} | null;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = requestQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, phone, email, propertyType, location, notes, configuratorSessionId } = parsed.data;

  // Honeypot check — see src/server/security/honeypot.ts. Deliberately
  // returns a response indistinguishable from a genuine success (same
  // status, same shape, a plausible-looking id) without touching the
  // database at all — no Customer/Lead/SiteSurveyRequest/Quote is created.
  if (isHoneypotTriggered(parsed.data[HONEYPOT_FIELD_NAME])) {
    return NextResponse.json({ ok: true, requestId: crypto.randomUUID() }, { status: 201 });
  }

  try {
    type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
    type QuoteCreateData = Parameters<TransactionClient["quote"]["create"]>[0]["data"];

    const { requestId } = await prisma.$transaction(async (tx: TransactionClient) => {
      // Look up the session BEFORE creating anything, so a bad/stale
      // sessionId can't half-fail a transaction partway through.
      const session = configuratorSessionId ? await tx.configuratorSession.findUnique({ where: { id: configuratorSessionId } }) : null;

      const customer = await tx.customer.create({
        data: { name, phone, email: email || null, source: "REQUEST_QUOTE_FORM" },
      });
      const lead = await tx.lead.create({
        data: { customerId: customer.id, journeySource: session ? "CONFIGURATOR" : "DIRECT_CONTACT", status: "NEW" },
      });
      const siteSurveyRequest = await tx.siteSurveyRequest.create({
        data: {
          leadId: lead.id,
          name,
          phone,
          propertyType,
          location,
          notes: notes || null,
          configurationReference: session?.id ?? null,
        },
      });

      if (session) {
        await tx.configuratorSession.update({ where: { id: session.id }, data: { leadId: lead.id } });

        const result = session.computedResult as StoredComputedResult;
        const hasEstimate = result?.siteSurveyRequired === false && result.estimate;

        const quoteData: QuoteCreateData = {
          leadId: lead.id,
          // Carries forward the session's already-validated provenance
          // (validated once, server-side, at Configurator submission time —
          // see ConfiguratorSession.sourcePackageId / resolveValidatedSourcePackageId
          // in src/server/publicRoutes/packageCatalogue.ts). Reuses Quote's
          // existing `packageId` field rather than inventing a parallel one;
          // null for a normal, package-less Configurator session.
          packageId: session.sourcePackageId,
          type: "CONFIGURATOR_ESTIMATE",
          status: "DRAFT",
          totalEstimatedLow: hasEstimate ? result!.estimate!.low : null,
          totalEstimatedHigh: hasEstimate ? result!.estimate!.high : null,
          isEstimateOnly: true,
          siteSurveyRequired: result?.siteSurveyRequired ?? true,
          configurationSnapshot: session.answers as QuoteCreateData["configurationSnapshot"],
          pricingRulesSnapshot: (result?.pricingRulesSnapshot ?? {}) as QuoteCreateData["pricingRulesSnapshot"],
        };
        const quote = await tx.quote.create({ data: quoteData });

        if (hasEstimate) {
          const answers = session.answers as { cameraCount?: number; coverageTierId?: string };
          await tx.quoteItem.create({
            data: {
              quoteId: quote.id,
              itemType: "CUSTOM_LINE",
              description: `CCTV system — ${answers.coverageTierId ?? "standard"} coverage, ${answers.cameraCount ?? "?"} camera(s). Estimated ${result!.estimate!.low.toLocaleString()}–${result!.estimate!.high.toLocaleString()} PKR.`,
              quantity: 1,
              unitPriceSnapshot: result!.estimate!.low,
              lineTotal: result!.estimate!.low,
            },
          });
        }
      }

      return { requestId: siteSurveyRequest.id };
    });

    return NextResponse.json({ ok: true, requestId }, { status: 201 });
  } catch (error) {
    console.error("[public-lead-error]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or contact us on WhatsApp." },
      { status: 500 }
    );
  }
}
