"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const CORE_SECTIONS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/quotes", label: "Quotes" },
  { href: "/admin/site-surveys", label: "Site Surveys" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/warranties", label: "Warranties" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/installation-rates", label: "Installation Rates" },
  { href: "/admin/availability", label: "Availability" },
];

const FUTURE_SECTIONS = [{ href: "/admin/pricing-audit-log", label: "Pricing Audit Log" }];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav
      style={{
        width: 220,
        borderRight: "1px solid #E2E8F0",
        background: "#0F172A",
        color: "#CBD5E1",
        padding: "20px 0",
        display: "flex",
        flexDirection: "column",
        fontSize: 13,
      }}
    >
      <div style={{ padding: "0 20px 20px", fontWeight: 600, color: "#fff", fontSize: 15 }}>
        Securivon Admin
      </div>

      <div style={{ padding: "0 20px 8px", fontSize: 11, textTransform: "uppercase", color: "#64748B", letterSpacing: 0.5 }}>
        Manage
      </div>
      {CORE_SECTIONS.map((s) => (
        <Link
          key={s.href}
          href={s.href as never}
          style={{
            padding: "9px 20px",
            color: pathname === s.href ? "#fff" : "#CBD5E1",
            background: pathname === s.href ? "#1E293B" : "transparent",
            textDecoration: "none",
          }}
        >
          {s.label}
        </Link>
      ))}

      <div style={{ padding: "16px 20px 8px", fontSize: 11, textTransform: "uppercase", color: "#64748B", letterSpacing: 0.5 }}>
        Coming later
      </div>
      {FUTURE_SECTIONS.map((s) => (
        <Link
          key={s.href}
          href={s.href as never}
          style={{ padding: "9px 20px", color: "#64748B", textDecoration: "none" }}
        >
          {s.label}
        </Link>
      ))}

      <div style={{ marginTop: "auto", padding: "20px" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "8px 0",
            background: "transparent",
            border: "1px solid #334155",
            borderRadius: 6,
            color: "#CBD5E1",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
