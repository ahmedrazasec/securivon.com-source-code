/**
 * Real mount point for the Rounding Rule Admin API (singleton settings
 * row). All logic lives in src/server/adminRoutes/pricingConfig.ts.
 */
export { getRoundingRule as GET, upsertRoundingRule as PATCH } from "@/server/adminRoutes/pricingConfig";
