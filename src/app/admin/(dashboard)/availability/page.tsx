import { NotConnectedSection } from "@/components/admin/NotConnectedSection";
export default function AvailabilityPage() {
  return (
    <div>
      <NotConnectedSection
        title="Availability"
        description="Overview of product availability across the catalogue — In Stock, Low Stock, Out of Stock, Order Required, Discontinued, Unknown. This reads the same Product.availability field managed on each product's own edit screen; it's not a separate data source."
        servicePath="prisma/schema.prisma (Availability enum)"
        routePath="src/server/adminRoutes/products.ts (GET, filterable)"
        columns={["Product", "Category", "Availability", "Last Verified"]}
      />
      <div style={{ marginTop: 16, fontSize: 12, color: "#94A3B8", maxWidth: 640 }}>
        Public pages only ever show availability status, never raw supplier stock quantities or
        lead-time details — those stay internal.
      </div>
    </div>
  );
}
