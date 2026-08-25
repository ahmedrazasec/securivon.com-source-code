/**
 * Real mount point for the Packages Admin API. All logic lives in
 * src/server/adminRoutes/packages.ts — this file only re-exports it at
 * its real Next.js route path. Do not add logic here.
 */
export { listPackages as GET, createPackage as POST } from "@/server/adminRoutes/packages";
