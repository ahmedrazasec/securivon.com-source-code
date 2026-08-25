/**
 * Real mount point for the public Configurator estimate API. All logic
 * lives in src/server/publicRoutes/configurator.ts — this file only
 * re-exports it at its real Next.js route path. Do not add logic here.
 */
export { POST } from "@/server/publicRoutes/configurator";
