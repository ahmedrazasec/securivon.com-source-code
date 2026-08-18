import "server-only";
import { prisma } from "@/server/db/client";
import type {
  PricingAuditLogRepository,
  PricingAuditLogRecord,
  PricingAuditLogCreateInput,
} from "@/server/repositories/types";

/** Real, database-backed PricingAuditLogRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaPricingAuditLogRepository implements PricingAuditLogRepository {
  async create(input: PricingAuditLogCreateInput) {
    return toRecord(await prisma.pricingAuditLog.create({ data: input }));
  }
  async listForEntity(entityType: string, entityId: string) {
    const rows = await prisma.pricingAuditLog.findMany({
      where: { entityType, entityId },
      orderBy: { changedAt: "desc" },
    });
    return rows.map(toRecord);
  }
  async listRecent(limit = 50) {
    const rows = await prisma.pricingAuditLog.findMany({ orderBy: { changedAt: "desc" }, take: limit });
    return rows.map(toRecord);
  }
}

function toRecord(r: Awaited<ReturnType<typeof prisma.pricingAuditLog.create>>): PricingAuditLogRecord {
  return {
    id: r.id,
    adminUserId: r.adminUserId,
    action: r.action as PricingAuditLogRecord["action"],
    entityType: r.entityType,
    entityId: r.entityId,
    fieldChanged: r.fieldChanged,
    oldValue: r.oldValue,
    newValue: r.newValue,
    changedAt: r.changedAt.toISOString(),
  };
}
