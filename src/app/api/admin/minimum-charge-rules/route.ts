/**
 * Real mount point for the Minimum Charge Rules Admin API (list). All
 * logic lives in src/server/adminRoutes/pricingConfig.ts — this file only
 * re-exports it at its real Next.js route path. Do not add logic here.
 */
export { listMinimumChargeRules as GET } from "@/server/adminRoutes/pricingConfig";
