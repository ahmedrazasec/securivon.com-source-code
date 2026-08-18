import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySupplierRepository } from "@test-fakes/repositories";
import { toPublicSupplier } from "@/server/serializers/product";
import type { SupplierCreateInput } from "@/server/repositories/types";

function baseSupplierInput(overrides: Partial<SupplierCreateInput> = {}): SupplierCreateInput {
  return {
    name: "DEMO SUPPLIER — NOT FOR PRODUCTION",
    contactInfo: { phone: "0300-0000000" },
    tier: "DISCOVERY",
    notes: "Negotiated 15% margin — CONFIDENTIAL, internal only",
    ...overrides,
  };
}

describe("Supplier data isolation", () => {
  let suppliers: InMemorySupplierRepository;

  beforeEach(() => {
    suppliers = new InMemorySupplierRepository();
  });

  it("the Admin repository DOES store internal notes (Admin needs to see them)", async () => {
    const created = await suppliers.create(baseSupplierInput());
    const found = await suppliers.findById(created.id);
    expect(found?.notes).toContain("margin");
  });

  it("the public serializer strips notes even when given the full Admin record", async () => {
    const created = await suppliers.create(baseSupplierInput());
    const found = await suppliers.findById(created.id);

    const publicView = toPublicSupplier(found!);
    expect(publicView).not.toHaveProperty("notes");
    expect(publicView).not.toHaveProperty("contactInfo");
    expect(publicView).not.toHaveProperty("tier");
    expect(JSON.stringify(publicView)).not.toContain("margin");
    expect(JSON.stringify(publicView)).not.toContain("0300-0000000");
  });

  it("the public serializer only exposes id and name", () => {
    const created = { id: "s1", name: "Demo Distributor" } as const;
    // toPublicSupplier's return type itself is Pick<..., "id" | "name">,
    // so this is also a compile-time guarantee, not just a runtime check.
    const view = toPublicSupplier({
      id: created.id,
      name: created.name,
      tier: "STRONG",
      notes: "should never appear",
    });
    expect(Object.keys(view).sort()).toEqual(["id", "name"]);
  });
});
