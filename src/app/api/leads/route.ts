/**
 * Real mount point for the public "Request a Quote" lead-capture API. All
 * logic lives in src/server/publicRoutes/leads.ts — this file only
 * re-exports it at its real Next.js route path. Do not add logic here.
 */
export { POST } from "@/server/publicRoutes/leads";
