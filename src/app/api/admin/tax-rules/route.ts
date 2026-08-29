/**
 * Real mount point for the Tax Rules Admin API. All logic lives in
 * src/server/adminRoutes/pricingConfig.ts — this file only re-exports it
 * at its real Next.js route path. Do not add logic here.
 */
export { listTaxRules as GET, createTaxRule as POST } from "@/server/adminRoutes/pricingConfig";
