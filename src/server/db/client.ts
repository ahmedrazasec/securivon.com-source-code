import "server-only";

/**
 * Prisma client singleton.
 *
 * This is the ONLY file in the codebase that should import `@prisma/client`
 * directly. Every other server module (pricing engine, storage engine,
 * site-survey rules, serializers) takes data as plain parameters instead of
 * importing this client, so business logic stays testable without a real
 * database connection — see src/server/pricing/engine.ts for the pattern.
 *
 * Repository modules under src/server/repositories/* are the intended
 * consumers of this client; API routes should go through repositories,
 * not import this file directly, so the "never expose supplier cost"
 * allowlist rule (src/server/serializers/*) is applied in exactly one place.
 *
 * SANDBOX NOTE (see README "Known limitations"): `@prisma/client`'s generated
 * types only exist after `npx prisma generate` has run successfully, which
 * requires network access to binaries.prisma.sh. That domain was not
 * reachable in the sandbox this scaffold was built in, so this file is
 * currently excluded from the TypeScript project (see tsconfig.json) to keep
 * `next build` / `tsc --noEmit` green for everything else. Remove that
 * exclusion the first time you run `npx prisma generate` in an environment
 * with normal network access — this file itself does not need to change.
 */
import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma__: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
