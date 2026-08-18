import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Admin dashboard layout — wraps every /admin/* page except /admin/login
 * (which intentionally has no nav chrome, since it's the entry point).
 *
 * This layout itself needs no database access, so it's a real, fully
 * functional part of this foundation — only the data *within* each section
 * depends on Prisma being available (see each section's page.tsx).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <AdminNav />
      <main style={{ flex: 1, padding: "32px 40px", background: "#F8FAFC" }}>{children}</main>
    </div>
  );
}
