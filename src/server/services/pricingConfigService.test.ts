import { describe, it, expect, beforeEach } from "vitest";
import { PricingConfigAdminService } from "@/server/services/pricingConfigService";
import {
  InMemoryPricingTierRepository,
  InMemoryCablingRateRepository,
  InMemoryRoundingRuleRepository,
  InMemoryPricingAuditLogRepository,
  InMemoryDiscountRepository,
  InMemoryTaxRuleRepository,
  InMemoryMinimumChargeRuleRepository,
} from "@test-fakes/repositories";

/**
 * Covers only the Discount/TaxRule/MinimumChargeRule methods added to
 * PricingConfigAdminService in this batch. The pre-existing PricingTier/
 * CablingRate/RoundingRule methods aren't re-tested here — they're
 * unchanged and already verified end-to-end on the real Supabase-backed
 * Admin dashboard.
 */
describe("PricingConfigAdminService — Discount / TaxRule / MinimumChargeRule", () => {
  let discounts: InMemoryDiscountRepository;
  let taxRules: InMemoryTaxRuleRepository;
  let minimumChargeRules: InMemoryMinimumChargeRuleRepository;
  let auditLog: InMemoryPricingAuditLogRepository;
  let service: PricingConfigAdminService;

  beforeEach(() => {
    discounts = new InMemoryDiscountRepository();
    taxRules = new InMemoryTaxRuleRepository();
    minimumChargeRules = new InMemoryMinimumChargeRuleRepository();
    auditLog = new InMemoryPricingAuditLogRepository();
    service = new PricingConfigAdminService(
      new InMemoryPricingTierRepository(),
      new InMemoryCablingRateRepository(),
      new InMemoryRoundingRuleRepository(),
      auditLog,
      discounts,
      taxRules,
      minimumChargeRules
    );
  });

  describe("Discount", () => {
    it("creates a discount and records a CREATE audit entry", async () => {
      const discount = await service.createDiscount("admin-1", {
        name: "Eid Promo",
        type: "PERCENTAGE",
        value: 10,
        appliesToPackageId: null,
        appliesToCategoryId: null,
        sitewide: true,
        validFrom: null,
        validUntil: null,
        active: true,
      });
      expect(discount.name).toBe("Eid Promo");
      expect(discount.value).toBe(10);

      const entries = await auditLog.listForEntity("Discount", discount.id);
      expect(entries.some((e) => e.action === "CREATE")).toBe(true);
    });

    it("updates a discount and records an UPDATE audit entry only for changed fields", async () => {
      const discount = await service.createDiscount("admin-1", {
        name: "Eid Promo",
        type: "PERCENTAGE",
        value: 10,
        appliesToPackageId: null,
        appliesToCategoryId: null,
        sitewide: true,
        validFrom: null,
        validUntil: null,
        active: false,
      });
      await service.updateDiscount("admin-2", discount.id, { active: true });

      const entries = await auditLog.listForEntity("Discount", discount.id);
      const updateEntries = entries.filter((e) => e.action === "UPDATE");
      expect(updateEntries).toHaveLength(1);
      expect(updateEntries[0].fieldChanged).toBe("active");
      expect(updateEntries[0].oldValue).toBe("false");
      expect(updateEntries[0].newValue).toBe("true");
      expect(updateEntries[0].adminUserId).toBe("admin-2");
    });

    it("deletes a discount and records an ARCHIVE audit entry", async () => {
      const discount = await service.createDiscount("admin-1", {
        name: "Eid Promo",
        type: "FIXED_AMOUNT",
        value: 5000,
        appliesToPackageId: null,
        appliesToCategoryId: null,
        sitewide: true,
        validFrom: null,
        validUntil: null,
        active: true,
      });
      await service.deleteDiscount("admin-1", discount.id);

      expect(await service.listDiscounts()).toHaveLength(0);
      const entries = await auditLog.listForEntity("Discount", discount.id);
      expect(entries.some((e) => e.action === "ARCHIVE" && e.fieldChanged === "deleted")).toBe(true);
    });
  });

  describe("TaxRule", () => {
    it("creates a tax rule and records a CREATE audit entry", async () => {
      const rule = await service.createTaxRule("admin-1", {
        name: "General Sales Tax",
        ratePercentage: 17,
        appliesTo: "ALL",
        inclusiveOrExclusive: "EXCLUSIVE",
        active: true,
      });
      expect(rule.ratePercentage).toBe(17);
      const entries = await auditLog.listForEntity("TaxRule", rule.id);
      expect(entries.some((e) => e.action === "CREATE")).toBe(true);
    });

    it("updates only the changed field and logs it", async () => {
      const rule = await service.createTaxRule("admin-1", {
        name: "General Sales Tax",
        ratePercentage: 17,
        appliesTo: "ALL",
        inclusiveOrExclusive: "EXCLUSIVE",
        active: false,
      });
      await service.updateTaxRule("admin-2", rule.id, { ratePercentage: 18 });

      const entries = (await auditLog.listForEntity("TaxRule", rule.id)).filter((e) => e.action === "UPDATE");
      expect(entries).toHaveLength(1);
      expect(entries[0].fieldChanged).toBe("ratePercentage");
      expect(entries[0].oldValue).toBe("17");
      expect(entries[0].newValue).toBe("18");
    });

    it("deletes a tax rule and records an ARCHIVE audit entry", async () => {
      const rule = await service.createTaxRule("admin-1", {
        name: "General Sales Tax",
        ratePercentage: 17,
        appliesTo: "ALL",
        inclusiveOrExclusive: "UNSTATED",
        active: true,
      });
      await service.deleteTaxRule("admin-1", rule.id);
      expect(await service.listTaxRules()).toHaveLength(0);
    });
  });

  describe("MinimumChargeRule", () => {
    it("creates a new rule on first upsert for a service type, defaulting unset amount to 0", async () => {
      const result = await service.upsertMinimumChargeRule("admin-1", "CCTV", {});
      expect(result.serviceType).toBe("CCTV");
      expect(result.minimumChargeAmount).toBe(0); // never a fabricated non-zero default

      const entries = await auditLog.listForEntity("MinimumChargeRule", result.id);
      expect(entries.some((e) => e.action === "CREATE")).toBe(true);
    });

    it("updates the existing row for a service type on subsequent upserts, rather than creating a duplicate", async () => {
      const first = await service.upsertMinimumChargeRule("admin-1", "CCTV", { minimumChargeAmount: 15000 });
      const second = await service.upsertMinimumChargeRule("admin-2", "CCTV", { minimumChargeAmount: 20000 });

      expect(second.id).toBe(first.id);
      expect(second.minimumChargeAmount).toBe(20000);
      expect(await service.listMinimumChargeRules()).toHaveLength(1);

      const entries = await auditLog.listForEntity("MinimumChargeRule", first.id);
      expect(entries.filter((e) => e.action === "UPDATE")).toHaveLength(1);
    });

    it("keeps other service types independent", async () => {
      await service.upsertMinimumChargeRule("admin-1", "CCTV", { minimumChargeAmount: 15000 });
      await service.upsertMinimumChargeRule("admin-1", "NETWORKING", { minimumChargeAmount: 8000 });

      const rules = await service.listMinimumChargeRules();
      expect(rules).toHaveLength(2);
      expect(rules.find((r) => r.serviceType === "CCTV")?.minimumChargeAmount).toBe(15000);
      expect(rules.find((r) => r.serviceType === "NETWORKING")?.minimumChargeAmount).toBe(8000);
    });
  });
});
