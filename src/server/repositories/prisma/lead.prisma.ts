import "server-only";
import { prisma } from "@/server/db/client";
import type { LeadRepository, LeadListRecord, LeadDetailRecord } from "@/server/repositories/types";
import { toCustomerSummary, toQuoteListRecord, toSiteSurveyRequestListRecord } from "@/server/repositories/prisma/crmShared";

/**
 * Real, database-backed LeadRepository. Read-only — see types.ts's
 * "Leads / Quotes / Site Surveys" section header for why this deliberately
 * has no create/update methods. Excluded from tsconfig — see adminUser.prisma.ts.
 */
export class PrismaLeadRepository implements LeadRepository {
  async list(filter?: { status?: LeadListRecord["status"] }): Promise<LeadListRecord[]> {
    const rows = await prisma.lead.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        _count: { select: { quotes: true, siteSurveyRequests: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      journeySource: row.journeySource as LeadListRecord["journeySource"],
      status: row.status as LeadListRecord["status"],
      assignedTo: row.assignedTo,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      customer: toCustomerSummary(row.customer),
      quoteCount: row._count.quotes,
      siteSurveyRequestCount: row._count.siteSurveyRequests,
    }));
  }

  async findById(id: string): Promise<LeadDetailRecord | null> {
    const row = await prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        _count: { select: { quotes: true, siteSurveyRequests: true } },
        quotes: { orderBy: { createdAt: "desc" } },
        siteSurveyRequests: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!row) return null;

    return {
      id: row.id,
      journeySource: row.journeySource as LeadListRecord["journeySource"],
      status: row.status as LeadListRecord["status"],
      assignedTo: row.assignedTo,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      customer: toCustomerSummary(row.customer),
      quoteCount: row._count.quotes,
      siteSurveyRequestCount: row._count.siteSurveyRequests,
      quotes: row.quotes.map((q) => toQuoteListRecord(q, row.customer)),
      siteSurveyRequests: row.siteSurveyRequests.map(toSiteSurveyRequestListRecord),
    };
  }
}
