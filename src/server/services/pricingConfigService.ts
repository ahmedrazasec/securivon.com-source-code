import "server-only";
import type {
  PricingTierRepository,
  PricingTierCreateInput,
  PricingTierUpdateInput,
  CablingRateRepository,
  CablingRateUpdateInput,
  RoundingRuleRepository,
  RoundingRuleUpdateInput,
  PricingAuditLogRepository,
} from "@/server/repositories/types";
import { diffPricingFields } from "@/server/repositories/pricingAudit";

/**
 * Pricing-config Admin service — PricingTier (coverage/recorder tiers),
 * CablingRate, RoundingRule. These three, together with the already-built
 * InstallationRate, are the actual blockers on the public Configurator
 * producing a real priced estimate (see
 * src/server/pricing/rateSetLoader.ts) — Discount/TaxRule/
 * MinimumChargeRule are optional-with-safe-fallback and not covered here.
 */
export class PricingConfigAdminService {
  constructor(
    private readonly pricingTiers: PricingTierRepository,
    private readonly cablingRate: CablingRateRepository,
    private readonly roundingRule: RoundingRuleRepository,
    private readonly auditLog: PricingAuditLogRepository
  ) {}

  async listPricingTiers() {
    return this.pricingTiers.list();
  }

  async createPricingTier(adminUserId: string, input: PricingTierCreateInput) {
    const created = await this.pricingTiers.create(input);
    for (const entry of diffPricingFields("PricingTier", created.id, adminUserId, "CREATE", null, created)) {
      await this.auditLog.create(entry);
    }
    return created;
  }

  async updatePricingTier(adminUserId: string, id: string, input: PricingTierUpdateInput) {
    const before = (await this.pricingTiers.list()).find((t) => t.id === id) ?? null;
    const after = await this.pricingTiers.update(id, input);
    for (const entry of diffPricingFields("PricingTier", id, adminUserId, "UPDATE", before, after)) {
      await this.auditLog.create(entry);
    }
    return after;
  }

  async deletePricingTier(adminUserId: string, id: string) {
    const before = (await this.pricingTiers.list()).find((t) => t.id === id) ?? null;
    await this.pricingTiers.delete(id);
    if (before) {
      await this.auditLog.create({
        adminUserId,
        action: "ARCHIVE",
        entityType: "PricingTier",
        entityId: id,
        fieldChanged: "deleted",
        oldValue: "false",
        newValue: "true",
      });
    }
  }

  async getCablingRate() {
    return this.cablingRate.getCurrent();
  }

  async upsertCablingRate(adminUserId: string, input: CablingRateUpdateInput) {
    const before = await this.cablingRate.getCurrent();
    const after = await this.cablingRate.upsert(input);
    for (const entry of diffPricingFields("CablingRate", after.id, adminUserId, before ? "UPDATE" : "CREATE", before, after)) {
      await this.auditLog.create(entry);
    }
    return after;
  }

  async getRoundingRule() {
    return this.roundingRule.getCurrent();
  }

  async upsertRoundingRule(adminUserId: string, input: RoundingRuleUpdateInput) {
    const before = await this.roundingRule.getCurrent();
    const after = await this.roundingRule.upsert(input);
    for (const entry of diffPricingFields("RoundingRule", after.id, adminUserId, before ? "UPDATE" : "CREATE", before, after)) {
      await this.auditLog.create(entry);
    }
    return after;
  }
}
