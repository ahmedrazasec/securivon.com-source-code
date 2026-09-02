/**
 * Real mount point for the admin catalogue-image upload API.
 *
 * All request handling, validation, authorization, and Supabase Storage
 * logic lives in src/server/adminRoutes/upload.ts — this file only
 * re-exports it at its real Next.js route path, matching every other
 * admin route's mount-file pattern.
 */
export { POST } from "@/server/adminRoutes/upload";
