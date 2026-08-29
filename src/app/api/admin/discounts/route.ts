/**
 * Real mount point for the Discounts Admin API. All logic lives in
 * src/server/adminRoutes/pricingConfig.ts — this file only re-exports it
 * at its real Next.js route path. Do not add logic here.
 */
export { listDiscounts as GET, createDiscount as POST } from "@/server/adminRoutes/pricingConfig";
