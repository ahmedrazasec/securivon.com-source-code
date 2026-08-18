import "server-only";
import type {
  InstallationRateRepository,
  InstallationRateRecord,
  InstallationRateUpdateInput,
  PricingAuditLogRepository,
} from "@/server/repositories/types";
import { diffPricingFields } from "@/server/repositories/pricingAudit";

/**
 * Installation Rate Admin service.
 *
 * One record per InstallationServiceType (CCTV / ACCESS_CONTROL / INTERCOM
 * / NETWORKING) — `upsert` rather than separate create/update, since Admin
 * is always editing "the CCTV installation rate," not creating arbitrary
 * new rate records. No production rate VALUES are set here or anywhere else
 * — every numeric default in the repository layer is 0 until Admin enters a
 * real, Ahmed-confirmed figure.
 */
export class InstallationRateAdminService {
  constructor(
    private readonly rates: InstallationRateRepository,
    private readonly auditLog: PricingAuditLogRepository
  ) {}

  async list() {
    return this.rates.list();
  }

  async findByServiceType(serviceType: InstallationRateRecord["serviceType"]) {
    return this.rates.findByServiceType(serviceType);
  }

  async upsert(
    adminUserId: string,
    serviceType: InstallationRateRecord["serviceType"],
    input: InstallationRateUpdateInput
  ): Promise<InstallationRateRecord> {
    const before = await this.rates.findByServiceType(serviceType);
    const after = await this.rates.upsert(serviceType, input);

    const entries = diffPricingFields(
      "InstallationRate",
      after.id,
      adminUserId,
      before ? "UPDATE" : "CREATE",
      before,
      after
    );
    for (const entry of entries) {
      await this.auditLog.create(entry);
    }

    return after;
  }
}
