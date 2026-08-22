/**
 * Real mount point for the Installation Rates Admin API (list). All logic
 * lives in src/server/adminRoutes/pricing.ts — this file only re-exports
 * it at its real Next.js route path. Do not add logic here.
 */
export { listInstallationRates as GET } from "@/server/adminRoutes/pricing";
