import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer auto-loads any .env file for the CLI (a deliberate
// breaking change — see the official v7 upgrade guide's "Explicit loading
// of environment variables" section). This project follows Next.js's own
// convention of using `.env.local` for local secrets (see README "Local
// development setup" and .env.example) rather than a bare `.env`, so we
// load both here, in the same precedence order Next.js itself uses:
// `.env` first as a base, then `.env.local` with `override: true` so it
// wins for any variable both files define.
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

/**
 * Prisma 7 CLI configuration.
 *
 * As of Prisma ORM v7, the connection URL and migration settings no longer
 * live in schema.prisma's datasource block (that produced error P1012 —
 * "The datasource property `url` is no longer supported in schema files").
 * This file is the new home for everything the Prisma CLI (validate,
 * generate, migrate, studio, db seed) needs to locate your schema and
 * connect to a database.
 *
 * IMPORTANT — this file is CLI-only, not used at application runtime:
 * `datasource.url` below is read by `prisma migrate`/`prisma studio`/etc.
 * The generated PrismaClient itself does NOT read this file — it requires
 * an explicit driver adapter (@prisma/adapter-pg) passed to its
 * constructor at runtime instead. See src/server/db/client.ts.
 *
 * Prisma 7 no longer auto-loads .env files for the CLI (a deliberate
 * breaking change — see the official v7 upgrade guide's "Explicit loading
 * of environment variables" section), hence the `import "dotenv/config"`
 * above and the `dotenv` devDependency.
 *
 * env() throws if DATABASE_URL is unset. That's intentional here — every
 * command that loads this file (including plain `prisma generate`) needs a
 * valid value, and failing loudly is better than silently falling back to
 * an empty/invalid connection string. See README "Local development setup"
 * for how to set DATABASE_URL in `.env.local` before running any Prisma
 * command.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
