import "server-only";
import type {
  PricingTierRepository,
  PricingTierCreateInput,
  PricingTierUpdateInput,
  CablingRateRepository,
  CablingRateUpdateInput,
  RoundingRuleRepository,
  RoundingRuleUpdateInput,
  DiscountRepository,
  DiscountCreateInput,
  DiscountUpdateInput,
  TaxRuleRepository,
  TaxRuleCreateInput,
  TaxRuleUpdateInput,
  MinimumChargeRuleRepository,
  MinimumChargeRuleRecord,
  MinimumChargeRuleUpdateInput,
  PricingAuditLogRepository,
} from "@/server/repositories/types";
import { diffPricingFields } from "@/server/repositories/pricingAudit";

/**
 * Pricing-config Admin service — PricingTier (coverage/recorder tiers),
 * CablingRate, RoundingRule, Discount, TaxRule, MinimumChargeRule.
 *
 * PricingTier/CablingRate/InstallationRate/RoundingRule are the actual
 * blockers on the public Configurator producing a real priced estimate
 * (see src/server/pricing/rateSetLoader.ts's `missingReasons` logic) —
 * Discount/TaxRule/MinimumChargeRule are optional-with-safe-fallback: the
 * engine already runs correctly with none configured (0% discount, 0% tax,
 * 0 minimum charge — see applyDiscount/applyTax in pricing/engine.ts and
 * rateSetLoader.ts's `minimumChargeAmount: minimumChargeRule ? ... : 0`).
 * Managing them here doesn't change that fallback behavior — it just makes
 * every field Admin-editable instead of only reachable directly in the DB.
 */
export class PricingConfigAdminService {
  constructor(
    private readonly pricingTiers: PricingTierRepository,
    private readonly cablingRate: CablingRateRepository,
    private readonly roundingRule: RoundingRuleRepository,
    private readonly auditLog: PricingAuditLogRepository,
    private readonly discounts: DiscountRepository,
    private readonly taxRules: TaxRuleRepository,
    private readonly minimumChargeRules: MinimumChargeRuleRepository
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

  // --------------------------------------------------------------------
  // Discount
  // --------------------------------------------------------------------

  async listDiscounts() {
    return this.discounts.list();
  }

  async createDiscount(adminUserId: string, input: DiscountCreateInput) {
    const created = await this.discounts.create(input);
    for (const entry of diffPricingFields("Discount", created.id, adminUserId, "CREATE", null, created)) {
      await this.auditLog.create(entry);
    }
    return created;
  }

  async updateDiscount(adminUserId: string, id: string, input: DiscountUpdateInput) {
    const before = (await this.discounts.list()).find((d) => d.id === id) ?? null;
    const after = await this.discounts.update(id, input);
    for (const entry of diffPricingFields("Discount", id, adminUserId, "UPDATE", before, after)) {
      await this.auditLog.create(entry);
    }
    return after;
  }

  async deleteDiscount(adminUserId: string, id: string) {
    const before = (await this.discounts.list()).find((d) => d.id === id) ?? null;
    await this.discounts.delete(id);
    if (before) {
      await this.auditLog.create({
        adminUserId,
        action: "ARCHIVE",
        entityType: "Discount",
        entityId: id,
        fieldChanged: "deleted",
        oldValue: "false",
        newValue: "true",
      });
    }
  }

  // --------------------------------------------------------------------
  // TaxRule
  // --------------------------------------------------------------------

  async listTaxRules() {
    return this.taxRules.list();
  }

  async createTaxRule(adminUserId: string, input: TaxRuleCreateInput) {
    const created = await this.taxRules.create(input);
    for (const entry of diffPricingFields("TaxRule", created.id, adminUserId, "CREATE", null, created)) {
      await this.auditLog.create(entry);
    }
    return created;
  }

  async updateTaxRule(adminUserId: string, id: string, input: TaxRuleUpdateInput) {
    const before = (await this.taxRules.list()).find((t) => t.id === id) ?? null;
    const after = await this.taxRules.update(id, input);
    for (const entry of diffPricingFields("TaxRule", id, adminUserId, "UPDATE", before, after)) {
      await this.auditLog.create(entry);
    }
    return after;
  }

  async deleteTaxRule(adminUserId: string, id: string) {
    const before = (await this.taxRules.list()).find((t) => t.id === id) ?? null;
    await this.taxRules.delete(id);
    if (before) {
      await this.auditLog.create({
        adminUserId,
        action: "ARCHIVE",
        entityType: "TaxRule",
        entityId: id,
        fieldChanged: "deleted",
        oldValue: "false",
        newValue: "true",
      });
    }
  }

  // --------------------------------------------------------------------
  // MinimumChargeRule — one row per serviceType, same upsert-by-key
  // pattern as InstallationRateAdminService.
  // --------------------------------------------------------------------

  async listMinimumChargeRules() {
    return this.minimumChargeRules.list();
  }

  async upsertMinimumChargeRule(
    adminUserId: string,
    serviceType: string,
    input: MinimumChargeRuleUpdateInput
  ): Promise<MinimumChargeRuleRecord> {
    const before = await this.minimumChargeRules.findByServiceType(serviceType);
    const after = await this.minimumChargeRules.upsert(serviceType, input);
    for (const entry of diffPricingFields(
      "MinimumChargeRule",
      after.id,
      adminUserId,
      before ? "UPDATE" : "CREATE",
      before,
      after
    )) {
      await this.auditLog.create(entry);
    }
    return after;
  }
}
