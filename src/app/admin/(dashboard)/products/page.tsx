import { NotConnectedSection } from "@/components/admin/NotConnectedSection";
export default function ProductsPage() {
  return (
    <NotConnectedSection
      title="Products"
      description="Create, edit, and archive products — name, slug, SKU, category, brand, description, specifications, use cases, warranty, availability, pricing status, and images."
      servicePath="src/server/services/productService.ts"
      routePath="src/server/adminRoutes/products.ts"
      columns={["Name", "SKU", "Category", "Brand", "Availability", "Pricing Status", "Status"]}
    />
  );
}
