import "server-only";
import { z } from "zod";

/**
 * Minimal honeypot spam mitigation for public write endpoints
 * (/api/leads, /api/configurator) — not a CAPTCHA, no external service, no
 * new dependency. A field named "website" is rendered in both public forms
 * but hidden from real users (off-screen, not display:none — see the
 * comment on HONEYPOT_INPUT_STYLE in each form component for why).
 * Automated form-fillers routinely populate every field they find,
 * including ones a human never sees, so a non-empty value here is treated
 * as a strong bot signal — deliberately not a proof, just a cheap filter
 * that costs legitimate users nothing.
 *
 * HANDLING RULE (both endpoints): when triggered, skip all database writes
 * entirely and return a response that is INDISTINGUISHABLE in shape and
 * status code from a genuine success — never a distinct error, status
 * code, or message. A distinguishable response would let a bot learn
 * which field to leave blank next time; an identical one gives it no
 * signal at all.
 */

export const HONEYPOT_FIELD_NAME = "website";

/**
 * Zod fragment for the honeypot field itself. Deliberately permissive
 * (loose max length, no format constraint) so a bot filling it with
 * garbage never fails validation on its own — that would produce a
 * distinguishable 400 response, exactly what this is trying to avoid. The
 * decision of "is this a bot" happens in isHoneypotTriggered below, after
 * parsing succeeds, not in the schema.
 */
export const honeypotFieldSchema = z.string().trim().max(500).optional().default("");

/** True if the honeypot field was filled in — the one and only signal used. */
export function isHoneypotTriggered(honeypotValue: string): boolean {
  return honeypotValue.length > 0;
}
