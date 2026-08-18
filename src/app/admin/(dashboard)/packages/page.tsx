import { NotConnectedSection } from "@/components/admin/NotConnectedSection";
export default function PackagesPage() {
  return (
    <div>
      <NotConnectedSection
        title="Packages"
        description="Create, edit, and archive packages. Add/remove products as package items, set quantities, required/optional and included/excluded/optional-addon status, ordering, and package status."
        servicePath="src/server/services/packageService.ts"
        routePath="src/server/adminRoutes/packages.ts"
        columns={["Name", "Category", "Item Count", "Price Type", "Status"]}
      />
      <div style={{ marginTop: 16, fontSize: 12, color: "#94A3B8", maxWidth: 640 }}>
        Package items always reference an actual product by ID — never a duplicated copy of product
        data. This is enforced both by the data model (PackageItem.productId is a foreign key) and
        at the API layer (src/server/adminRoutes/packages.ts checks the product exists before adding
        an item), and proven in src/server/services/packageService.test.ts.
      </div>
    </div>
  );
}
