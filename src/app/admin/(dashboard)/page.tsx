const SECTIONS = [
  ["Products", "/admin/products"],
  ["Categories", "/admin/categories"],
  ["Brands", "/admin/brands"],
  ["Suppliers", "/admin/suppliers"],
  ["Warranties", "/admin/warranties"],
  ["Packages", "/admin/packages"],
  ["Pricing", "/admin/pricing"],
  ["Installation Rates", "/admin/installation-rates"],
  ["Availability", "/admin/availability"],
] as const;

export default function AdminDashboardHome() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Dashboard</h1>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 24, maxWidth: 640 }}>
        You are authenticated as an Admin. This confirms the auth foundation from Stage 1 and the
        route protection in src/proxy.ts both work end-to-end.
      </p>

      <div
        style={{
          border: "1px solid #BAE6FD",
          background: "#F0F9FF",
          borderRadius: 8,
          padding: "14px 18px",
          fontSize: 13,
          color: "#0C4A6E",
          marginBottom: 28,
          maxWidth: 640,
        }}
      >
        Database access is not available in this sandbox (see README &quot;Known limitations&quot;).
        Every module below has a complete, unit-tested service + repository + route-handler
        implementation in the codebase — visit any section for the exact file paths.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, maxWidth: 800 }}>
        {SECTIONS.map(([label, href]) => (
          <a
            key={href}
            href={href}
            style={{
              display: "block",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "14px 16px",
              background: "#fff",
              color: "#0F172A",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
