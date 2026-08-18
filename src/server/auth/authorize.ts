import "server-only";
import type { AdminSessionPayload } from "./session";

/**
 * Authorization boundary.
 *
 * MVP only ever grants "ADMIN" — the other roles exist in the type/schema so
 * a future rollout of Content Editor / Pricing Manager / Sales-Ops doesn't
 * require a data-model change, but `isAuthorized` below intentionally does
 * NOT implement fine-grained per-role permission logic yet, per your explicit
 * "don't overbuild role management now" instruction. When that's needed,
 * this is the single place to add it.
 */

export type AdminAction = "VIEW_ADMIN" | "EDIT_PRICING" | "EDIT_CONTENT" | "MANAGE_LEADS";

export function isAuthorized(session: AdminSessionPayload | null, _action: AdminAction): boolean {
  if (!session) return false;
  // MVP: any authenticated ADMIN session is authorized for every action.
  // Non-ADMIN roles are rejected outright until per-role rules are defined.
  return session.role === "ADMIN";
}
