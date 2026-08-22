/**
 * Real mount point for the Products Admin API.
 *
 * All request handling, validation, authorization, and persistence logic
 * lives in src/server/adminRoutes/products.ts — this file only re-exports
 * it at its real Next.js route path. Do not add logic here; edit the
 * handler in adminRoutes instead so there is a single source of truth.
 */
export { GET, POST } from "@/server/adminRoutes/products";
