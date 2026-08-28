import "server-only";
import { prisma } from "@/server/db/client";
import type { CustomerSummary, QuoteItemRecord, QuoteListRecord, QuoteDetailRecord, SiteSurveyRequestListRecord, SiteSurveyRequestDetailRecord } from "@/server/repositories/types";

/**
 * Shared row -> record converters for the Lead / Quote / SiteSurveyRequest
 * read-only Admin repositories (lead.prisma.ts, quote.prisma.ts,
 * siteSurveyRequest.prisma.ts).
 *
 * Centralized here (rather than duplicated per-file, or having the three
 * repository files import from each other) because Lead's detail view
 * embeds Quote and SiteSurveyRequest rows and needs the exact same
 * shaping those repositories use for their own listings — a single
 * source of truth avoids the three views silently drifting apart.
 */

type CustomerRow = NonNullable<Awaited<ReturnType<typeof prisma.customer.findUnique>>>;
type QuoteRow = Awaited<ReturnType<typeof prisma.quote.findMany>>[number];
type QuoteItemRow = Awaited<ReturnType<typeof prisma.quoteItem.findMany>>[number];
type SiteSurveyRequestRow = Awaited<ReturnType<typeof prisma.siteSurveyRequest.findMany>>[number];

export function toCustomerSummary(c: CustomerRow): CustomerSummary {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    whatsappNumber: c.whatsappNumber,
    email: c.email,
    addressArea: c.addressArea,
    source: c.source as CustomerSummary["source"],
    createdAt: c.createdAt.toISOString(),
  };
}

export function toQuoteListRecord(q: QuoteRow, customer: CustomerRow): QuoteListRecord {
  return {
    id: q.id,
    leadId: q.leadId,
    packageId: q.packageId,
    type: q.type as QuoteListRecord["type"],
    status: q.status as QuoteListRecord["status"],
    totalEstimatedLow: q.totalEstimatedLow ? Number(q.totalEstimatedLow) : null,
    totalEstimatedHigh: q.totalEstimatedHigh ? Number(q.totalEstimatedHigh) : null,
    isEstimateOnly: q.isEstimateOnly,
    siteSurveyRequired: q.siteSurveyRequired,
    revisedFromQuoteId: q.revisedFromQuoteId,
    validUntil: q.validUntil ? q.validUntil.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    customer: toCustomerSummary(customer),
  };
}

export function toQuoteItemRecord(i: QuoteItemRow): QuoteItemRecord {
  return {
    id: i.id,
    itemType: i.itemType as QuoteItemRecord["itemType"],
    productId: i.productId,
    packageId: i.packageId,
    description: i.description,
    quantity: i.quantity,
    unitPriceSnapshot: Number(i.unitPriceSnapshot),
    lineTotal: Number(i.lineTotal),
  };
}

export function toQuoteDetailRecord(q: QuoteRow, customer: CustomerRow, items: QuoteItemRow[]): QuoteDetailRecord {
  return {
    ...toQuoteListRecord(q, customer),
    configurationSnapshot: q.configurationSnapshot,
    pricingRulesSnapshot: q.pricingRulesSnapshot,
    items: items.map(toQuoteItemRecord),
  };
}

export function toSiteSurveyRequestListRecord(r: SiteSurveyRequestRow): SiteSurveyRequestListRecord {
  return {
    id: r.id,
    leadId: r.leadId,
    name: r.name,
    phone: r.phone,
    propertyType: r.propertyType,
    location: r.location,
    preferredDateTime: r.preferredDateTime,
    configurationReference: r.configurationReference,
    status: r.status as SiteSurveyRequestListRecord["status"],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function toSiteSurveyRequestDetailRecord(r: SiteSurveyRequestRow, customer: CustomerRow): SiteSurveyRequestDetailRecord {
  return {
    ...toSiteSurveyRequestListRecord(r),
    notes: r.notes,
    customer: toCustomerSummary(customer),
  };
}
