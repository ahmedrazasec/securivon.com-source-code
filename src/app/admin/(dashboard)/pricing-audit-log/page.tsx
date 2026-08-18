export default function PricingAuditLogPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Pricing Audit Log</h1>
      <p style={{ fontSize: 13, color: "#64748B", maxWidth: 640 }}>
        Viewer UI not built out this stage — but the underlying write path is real and tested: every
        pricing-relevant change to a Product, Package, or Installation Rate already generates an
        audit entry (admin user, action, entity, field, old/new value, timestamp). See
        src/server/repositories/pricingAudit.ts and src/server/repositories/pricingAudit.test.ts.
      </p>
    </div>
  );
}
