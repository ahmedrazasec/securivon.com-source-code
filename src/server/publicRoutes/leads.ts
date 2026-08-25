import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";

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
 * KNOWN LIMITATION: no rate limiting or spam protection yet — matches
 * .env.example's already-documented SPAM_PROTECTION_KEY placeholder
 * ("not wired in yet"). Fine for initial testing; needs addressing before
 * this is linked from real marketing traffic.
 */

const PROPERTY_TYPES = ["HOME", "SHOP", "RESTAURANT", "OFFICE", "WAREHOUSE", "OTHER"] as const;

const requestQuoteSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  propertyType: z.enum(PROPERTY_TYPES),
  location: z.string().trim().min(2).max(200),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

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

  const { name, phone, email, propertyType, location, notes } = parsed.data;

  try {
    type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
    const { requestId } = await prisma.$transaction(async (tx: TransactionClient) => {
      const customer = await tx.customer.create({
        data: { name, phone, email: email || null, source: "REQUEST_QUOTE_FORM" },
      });
      const lead = await tx.lead.create({
        data: { customerId: customer.id, journeySource: "DIRECT_CONTACT", status: "NEW" },
      });
      const siteSurveyRequest = await tx.siteSurveyRequest.create({
        data: { leadId: lead.id, name, phone, propertyType, location, notes: notes || null },
      });
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
