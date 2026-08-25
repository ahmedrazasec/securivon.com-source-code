import "server-only";
import { prisma } from "@/server/db/client";
import type { CablingRateRepository, CablingRateRecord, CablingRateUpdateInput } from "@/server/repositories/types";

type CablingRateCreateData = Parameters<typeof prisma.cablingRate.create>[0]["data"];
type CablingRateUpdateData = Parameters<typeof prisma.cablingRate.update>[0]["data"];

// Never a fabricated non-zero default — starts at 0 until Admin enters a
// real, Ahmed-confirmed figure, same convention as InstallationRate.
const ZERO_DEFAULTS = { cableType: "Standard", ratePerMeter: 0, includedAllowancePerCamera: 0 };

/** Real, database-backed CablingRateRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaCablingRateRepository implements CablingRateRepository {
  async getCurrent() {
    const r = await prisma.cablingRate.findFirst({ orderBy: { updatedAt: "desc" } });
    return r ? toRecord(r) : null;
  }
  async upsert(input: CablingRateUpdateInput) {
    const existing = await prisma.cablingRate.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!existing) {
      const data: CablingRateCreateData = { ...ZERO_DEFAULTS, ...input };
      return toRecord(await prisma.cablingRate.create({ data }));
    }
    const data: CablingRateUpdateData = { ...input };
    return toRecord(await prisma.cablingRate.update({ where: { id: existing.id }, data }));
  }
}

function toRecord(r: NonNullable<Awaited<ReturnType<typeof prisma.cablingRate.create>>>): CablingRateRecord {
  return {
    id: r.id,
    cableType: r.cableType,
    ratePerMeter: Number(r.ratePerMeter),
    includedAllowancePerCamera: Number(r.includedAllowancePerCamera),
    verificationDate: r.verificationDate?.toISOString() ?? null,
  };
}
