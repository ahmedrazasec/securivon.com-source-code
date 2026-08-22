/**
 * Real mount point for the recent Pricing Audit Log Admin API. All logic
 * lives in src/server/adminRoutes/pricing.ts — this file only re-exports
 * it at its real Next.js route path. Do not add logic here.
 */
export { listRecentAuditLog as GET } from "@/server/adminRoutes/pricing";
