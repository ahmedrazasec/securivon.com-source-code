import "server-only";
import { prisma } from "@/server/db/client";
import type { SiteSurveyRequestRepository, SiteSurveyRequestListRecord, SiteSurveyRequestDetailRecord } from "@/server/repositories/types";
import { toSiteSurveyRequestListRecord, toSiteSurveyRequestDetailRecord } from "@/server/repositories/prisma/crmShared";

/**
 * Real, database-backed SiteSurveyRequestRepository. Read-only — see
 * types.ts's "Leads / Quotes / Site Surveys" section header. Excluded from
 * tsconfig — see adminUser.prisma.ts.
 */
export class PrismaSiteSurveyRequestRepository implements SiteSurveyRequestRepository {
  async list(filter?: { status?: SiteSurveyRequestListRecord["status"] }): Promise<SiteSurveyRequestListRecord[]> {
    const rows = await prisma.siteSurveyRequest.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toSiteSurveyRequestListRecord);
  }

  async findById(id: string): Promise<SiteSurveyRequestDetailRecord | null> {
    const row = await prisma.siteSurveyRequest.findUnique({
      where: { id },
      include: { lead: { include: { customer: true } } },
    });
    if (!row) return null;
    return toSiteSurveyRequestDetailRecord(row, row.lead.customer);
  }
}
