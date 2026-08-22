/**
 * Real mount point for the Categories Admin API. All logic lives in
 * src/server/adminRoutes/catalogueSupport.ts — this file only re-exports
 * it at its real Next.js route path. Do not add logic here.
 */
export { listCategories as GET, createCategory as POST } from "@/server/adminRoutes/catalogueSupport";
