import "server-only";

/**
 * Prisma client singleton — Prisma 7 driver-adapter architecture.
 *
 * This is the ONLY file in the codebase that should import the generated
 * Prisma Client directly. Every other server module (pricing engine,
 * storage engine, site-survey rules, serializers) takes data as plain
 * parameters instead of importing this client, so business logic stays
 * testable without a real database connection — see
 * src/server/pricing/engine.ts for the pattern.
 *
 * Repository modules under src/server/repositories/prisma/* are the
 * intended consumers of this client; API routes should go through
 * repositories, not import this file directly, so the "never expose
 * supplier cost" allowlist rule (src/server/serializers/*) is applied in
 * exactly one place.
 *
 * PRISMA 7 CHANGES FROM THE PREVIOUS VERSION OF THIS FILE:
 *   1. Import path is now the generated output (`src/generated/prisma/client`,
 *      per prisma/schema.prisma's `generator.output`), not `@prisma/client`
 *      directly — Prisma Client is no longer generated into node_modules
 *      by default in v7.
 *   2. PrismaClient's constructor no longer accepts a bare connection
 *      string or `datasources`/`datasourceUrl` options (both were removed
 *      in v7). It now requires an explicit driver adapter for every
 *      database. For PostgreSQL, that's `@prisma/adapter-pg`'s `PrismaPg`,
 *      constructed from DATABASE_URL and passed to `new PrismaClient({ adapter })`.
 *      This is the officially documented v7 migration pattern, not a
 *      workaround — see https://www.prisma.io/docs/orm/v6/more/upgrades/to-v7
 *      ("Driver adapters and client instantiation").
 *
 * SANDBOX NOTE (see README "Known limitations"): the generated client at
 * `src/generated/prisma/` only exists after `npx prisma generate` has run
 * successfully, which requires network access to binaries.prisma.sh. That
 * domain was not reachable in the sandbox this scaffold was built in, so
 * this file is currently excluded from the TypeScript project (see
 * tsconfig.json) to keep `next build` / `tsc --noEmit` green for everything
 * else. Remove that exclusion the first time you run `npx prisma generate`
 * in an environment with normal network access — this file itself does not
 * need to change.
 *
 * SSL NOTE for whenever a real connection (e.g. Supabase) is wired up:
 * Prisma 7 uses `node-pg` instead of the Rust query engine, which changed
 * SSL certificate validation defaults (previously-ignored invalid certs are
 * no longer ignored — see the v7 upgrade guide's "SSL certificate
 * validation changes" section). This may require an explicit `ssl` option
 * on `PrismaPg` below depending on how Supabase's connection string is
 * configured. Deliberately NOT pre-configured here — Stage 2.5 explicitly
 * scoped this change to Prisma 7 compatibility only, not an actual Supabase
 * connection; see STAGE-2.5-DATABASE-DIAGNOSIS.md for the exact next step.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __prisma__: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient = globalThis.__prisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
