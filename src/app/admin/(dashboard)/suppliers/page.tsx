import { NotConnectedSection } from "@/components/admin/NotConnectedSection";
export default function SuppliersPage() {
  return (
    <div>
      <NotConnectedSection
        title="Suppliers"
        description="Internal supplier records — name, tier, contact info, and private notes. This data is strictly internal."
        servicePath="prisma/schema.prisma (Supplier model)"
        routePath="src/server/adminRoutes/catalogueSupport.ts"
        columns={["Name", "Tier", "Contact"]}
      />
      <div style={{ marginTop: 16, fontSize: 12, color: "#94A3B8", maxWidth: 640 }}>
        Supplier cost, notes, and source URLs are never exposed through any public API — enforced by
        an allowlist serializer (src/server/serializers/product.ts), proven in
        src/server/repositories/supplierIsolation.test.ts.
      </div>
    </div>
  );
}
