/**
 * Real mount point for the Cabling Rate Admin API (singleton settings
 * row). All logic lives in src/server/adminRoutes/pricingConfig.ts.
 */
export { getCablingRate as GET, upsertCablingRate as PATCH } from "@/server/adminRoutes/pricingConfig";
