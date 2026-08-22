/**
 * Real mount point for the Brands Admin API. All logic lives in
 * src/server/adminRoutes/catalogueSupport.ts — this file only re-exports
 * it at its real Next.js route path. Do not add logic here.
 */
export { listBrands as GET, createBrand as POST } from "@/server/adminRoutes/catalogueSupport";
