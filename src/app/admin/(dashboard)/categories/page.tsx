import { NotConnectedSection } from "@/components/admin/NotConnectedSection";
export default function CategoriesPage() {
  return (
    <NotConnectedSection
      title="Categories"
      description="Manage product categories — name, slug, description, sort order, active status, and SEO metadata."
      servicePath="prisma/schema.prisma (Category model)"
      routePath="src/server/adminRoutes/catalogueSupport.ts"
      columns={["Name", "Slug", "Sort Order", "Active"]}
    />
  );
}
