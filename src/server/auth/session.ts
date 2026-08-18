import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * Admin session tokens.
 *
 * Single MVP role ("ADMIN") is issued today; the payload already carries a
 * `role` claim so future roles (Content Editor, Pricing Manager, Sales/Ops —
 * already present in the Prisma AdminRole enum) can be authorized against
 * without a token-format change later.
 */

export interface AdminSessionPayload extends JWTPayload {
  sub: string; // AdminUser.id
  email: string;
  role: "ADMIN" | "CONTENT_EDITOR" | "PRICING_MANAGER" | "SALES_OPERATIONS";
}

const SESSION_COOKIE_NAME = "securivon_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours — reasonable default, adjust once Ahmed has a preference.

function getSigningSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a strong random value (32+ chars) in your environment — see .env.example."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSigningSecret());
}

export async function verifyAdminSessionToken(
  token: string
): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSigningSecret());
    return payload as AdminSessionPayload;
  } catch {
    // Any failure (expired, tampered, malformed) is treated identically as
    // "not authenticated" — never leak *why* verification failed to the client.
    return null;
  }
}

export const ADMIN_SESSION_COOKIE_NAME = SESSION_COOKIE_NAME;
export const ADMIN_SESSION_TTL_SECONDS = SESSION_TTL_SECONDS;
