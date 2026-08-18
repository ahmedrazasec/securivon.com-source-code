import { NotConnectedSection } from "@/components/admin/NotConnectedSection";
export default function BrandsPage() {
  return (
    <NotConnectedSection
      title="Brands"
      description="Manage brands — name, slug, description, logo, verified website URL, and active status. Brand identity and URLs are only ever entered when confirmed real, never invented."
      servicePath="prisma/schema.prisma (Brand model)"
      routePath="src/server/adminRoutes/catalogueSupport.ts"
      columns={["Name", "Slug", "Country", "Website", "Active"]}
    />
  );
}
