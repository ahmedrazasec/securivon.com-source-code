import "server-only";
import bcrypt from "bcryptjs";

// Cost factor 12 — a standard, defensible default for bcrypt in 2026.
// Keep this a named constant so it's a deliberate, reviewable choice rather
// than a magic number buried in a function call.
const BCRYPT_COST_FACTOR = 12;

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, BCRYPT_COST_FACTOR);
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
