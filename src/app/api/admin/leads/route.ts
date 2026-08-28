/**
 * Real mount point for the Leads Admin API (read-only).
 *
 * All request handling, authorization, and data access live in
 * src/server/adminRoutes/leads.ts — this file only re-exports it at its
 * real Next.js route path. Do not add logic here.
 */
export { GET } from "@/server/adminRoutes/leads";
