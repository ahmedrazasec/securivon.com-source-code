import "server-only";
import { prisma } from "@/server/db/client";
import type { QuoteRepository, QuoteListRecord, QuoteDetailRecord } from "@/server/repositories/types";
import { toQuoteListRecord, toQuoteDetailRecord } from "@/server/repositories/prisma/crmShared";

/**
 * Real, database-backed QuoteRepository. Read-only except for status — see
 * updateStatus() below and src/server/quotes/immutability.ts for why
 * status is the only field ever allowed to change on an existing row.
 * Excluded from tsconfig — see adminUser.prisma.ts.
 */
export class PrismaQuoteRepository implements QuoteRepository {
  async list(filter?: { status?: QuoteListRecord["status"] }): Promise<QuoteListRecord[]> {
    const rows = await prisma.quote.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      orderBy: { createdAt: "desc" },
      include: { lead: { include: { customer: true } } },
    });
    return rows.map((row) => toQuoteListRecord(row, row.lead.customer));
  }

  async findById(id: string): Promise<QuoteDetailRecord | null> {
    const row = await prisma.quote.findUnique({
      where: { id },
      include: { lead: { include: { customer: true } }, items: { orderBy: { createdAt: "asc" } } },
    });
    if (!row) return null;
    return toQuoteDetailRecord(row, row.lead.customer, row.items);
  }

  async updateStatus(id: string, status: QuoteListRecord["status"]): Promise<QuoteDetailRecord | null> {
    await prisma.quote.update({ where: { id }, data: { status } }).catch(() => null);
    return this.findById(id);
  }
}
