/**
 * Real mount point for the Admin "change my own password" API. All logic
 * lives in src/server/adminRoutes/account.ts — this file only re-exports it
 * at its real Next.js route path. Do not add logic here.
 */
export { changeOwnPassword as PATCH } from "@/server/adminRoutes/account";
