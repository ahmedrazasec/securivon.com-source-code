import { describe, it, expect, beforeEach } from "vitest";
import { InstallationRateAdminService } from "@/server/services/installationRateService";
import { InMemoryInstallationRateRepository, InMemoryPricingAuditLogRepository } from "@test-fakes/repositories";

describe("InstallationRateAdminService", () => {
  let rates: InMemoryInstallationRateRepository;
  let auditLog: InMemoryPricingAuditLogRepository;
  let service: InstallationRateAdminService;

  beforeEach(() => {
    rates = new InMemoryInstallationRateRepository();
    auditLog = new InMemoryPricingAuditLogRepository();
    service = new InstallationRateAdminService(rates, auditLog);
  });

  it("creates a new rate record on first upsert for a service type, defaulting unset fields to 0", async () => {
    const result = await service.upsert("admin-1", "CCTV", { baseRatePerUnit: 3000 });
    expect(result.serviceType).toBe("CCTV");
    expect(result.baseRatePerUnit).toBe(3000);
    expect(result.minimumCharge).toBe(0); // never a fabricated non-zero default
  });

  it("logs a CREATE audit action for the first upsert", async () => {
    const result = await service.upsert("admin-1", "CCTV", { baseRatePerUnit: 3000 });
    const entries = await auditLog.listForEntity("InstallationRate", result.id);
    expect(entries.some((e) => e.action === "CREATE")).toBe(true);
  });

  it("logs an UPDATE audit action for subsequent upserts, with correct old/new values", async () => {
    const first = await service.upsert("admin-1", "CCTV", { baseRatePerUnit: 3000 });
    await service.upsert("admin-1", "CCTV", { baseRatePerUnit: 3500 });

    const entries = await auditLog.listForEntity("InstallationRate", first.id);
    const updateEntry = entries.find((e) => e.action === "UPDATE" && e.fieldChanged === "baseRatePerUnit");
    expect(updateEntry?.oldValue).toBe("3000");
    expect(updateEntry?.newValue).toBe("3500");
  });

  it("keeps separate rate records per service type", async () => {
    await service.upsert("admin-1", "CCTV", { baseRatePerUnit: 3000 });
    await service.upsert("admin-1", "ACCESS_CONTROL", { baseRatePerUnit: 5000 });

    const all = await service.list();
    expect(all).toHaveLength(2);
    expect(all.find((r) => r.serviceType === "CCTV")?.baseRatePerUnit).toBe(3000);
    expect(all.find((r) => r.serviceType === "ACCESS_CONTROL")?.baseRatePerUnit).toBe(5000);
  });

  it("does not log an audit entry when nothing actually changes", async () => {
    const first = await service.upsert("admin-1", "CCTV", { baseRatePerUnit: 3000 });
    const beforeCount = (await auditLog.listForEntity("InstallationRate", first.id)).length;
    await service.upsert("admin-1", "CCTV", { baseRatePerUnit: 3000 }); // identical value
    const afterCount = (await auditLog.listForEntity("InstallationRate", first.id)).length;
    expect(afterCount).toBe(beforeCount);
  });
});
