import "server-only";
import { prisma } from "@/server/db/client";
import type {
  InstallationRateRepository,
  InstallationRateRecord,
  InstallationRateUpdateInput,
} from "@/server/repositories/types";

/** Real, database-backed InstallationRateRepository. Excluded from tsconfig — see adminUser.prisma.ts. */
export class PrismaInstallationRateRepository implements InstallationRateRepository {
  async findByServiceType(serviceType: InstallationRateRecord["serviceType"]) {
    const r = await prisma.installationRate.findUnique({ where: { serviceType } });
    return r ? toRecord(r) : null;
  }
  async list() {
    return (await prisma.installationRate.findMany()).map(toRecord);
  }
  async upsert(serviceType: InstallationRateRecord["serviceType"], input: InstallationRateUpdateInput) {
    const result = await prisma.installationRate.upsert({
      where: { serviceType },
      create: { serviceType, ...zeroDefaults, ...input },
      update: input,
    });
    return toRecord(result);
  }
}

// Never a fabricated non-zero default — every rate starts at 0 until Admin
// enters a real, Ahmed-confirmed figure (Phase 2 Corrections §2).
const zeroDefaults = {
  baseRatePerUnit: 0,
  floorModifier: 0,
  heightAccessModifier: 0,
  conduitTrunkingModifier: 0,
  existingVsNewCablingModifier: 0,
  configurationFee: 0,
  remoteViewSetupFee: 0,
  minimumCharge: 0,
};

function toRecord(r: NonNullable<Awaited<ReturnType<typeof prisma.installationRate.findUnique>>>): InstallationRateRecord {
  return {
    id: r.id,
    serviceType: r.serviceType,
    baseRatePerUnit: Number(r.baseRatePerUnit),
    floorModifier: Number(r.floorModifier),
    heightAccessModifier: Number(r.heightAccessModifier),
    conduitTrunkingModifier: Number(r.conduitTrunkingModifier),
    existingVsNewCablingModifier: Number(r.existingVsNewCablingModifier),
    configurationFee: Number(r.configurationFee),
    remoteViewSetupFee: Number(r.remoteViewSetupFee),
    minimumCharge: Number(r.minimumCharge),
    verificationDate: r.verificationDate?.toISOString() ?? null,
  };
}
