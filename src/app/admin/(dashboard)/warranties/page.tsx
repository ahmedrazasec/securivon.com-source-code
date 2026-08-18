import { NotConnectedSection } from "@/components/admin/NotConnectedSection";
export default function WarrantiesPage() {
  return (
    <NotConnectedSection
      title="Warranties"
      description="Warranty records — duration, provider, type, coverage conditions, exclusions, and active status. Real terms only, once Securivon confirms them; nothing here is invented."
      servicePath="prisma/schema.prisma (Warranty model)"
      routePath="src/server/adminRoutes/catalogueSupport.ts"
      columns={["Name", "Duration", "Provider", "Active"]}
    />
  );
}
