import { NotConnectedSection } from "@/components/admin/NotConnectedSection";
export default function PricingPage() {
  return (
    <div>
      <NotConnectedSection
        title="Pricing"
        description="Edit product prices, price type (Fixed / Starting From / Range / Estimated / Quote Only), effective and review-due dates, and pricing status."
        servicePath="src/server/pricing/pricingStatus.ts"
        routePath="src/server/adminRoutes/products.ts (PATCH)"
        columns={["Product", "Price Type", "Value", "Pricing Status", "Review Due"]}
      />
      <div
        style={{
          marginTop: 16,
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          padding: "14px 18px",
          fontSize: 13,
          maxWidth: 640,
          background: "#fff",
        }}
      >
        <strong style={{ color: "#0F172A" }}>Pricing status rule (already enforced, already tested):</strong>
        <p style={{ color: "#475569", marginTop: 6 }}>
          A product&apos;s stored price type is only ever shown to customers when its pricing status
          is <code>VERIFIED</code>. <code>NEEDS_REVIEW</code> and <code>STALE</code> both force
          <code> QUOTE_ONLY</code> regardless of what price is on file — enforced in
          src/server/pricing/pricingStatus.ts and applied directly inside the public product
          serializer (src/server/serializers/product.ts), not left to individual call sites to
          remember. See pricingStatus.test.ts for the full test coverage.
        </p>
      </div>
    </div>
  );
}
