/**
 * Real mount point for the Suppliers Admin API. All logic lives in
 * src/server/adminRoutes/catalogueSupport.ts — this file only re-exports
 * it at its real Next.js route path. Do not add logic here.
 *
 * Note: listSuppliers/createSupplier require "EDIT_PRICING" authorization
 * (not just VIEW_ADMIN) since supplier data is cost-adjacent — enforced
 * inside catalogueSupport.ts, unchanged by mounting here.
 */
export { listSuppliers as GET, createSupplier as POST } from "@/server/adminRoutes/catalogueSupport";
