/**
 * One-time content migration: transcribes the existing, real, curated
 * service copy from src/lib/marketing/services.ts into the database-backed
 * Service table (see prisma/schema.prisma), publishing each as
 * status = "PUBLISHED" so /services and /services/[slug] keep showing
 * exactly what they showed before this batch.
 *
 * SAFETY / IDEMPOTENCE:
 *   - For each service, this ONLY creates a row if no Service with that
 *     slug already exists. It never updates or overwrites an existing row
 *     — if you've already run this once, or an admin has since edited a
 *     service through the admin UI, running this again is a safe no-op for
 *     every slug that already exists. This is intentionally NOT an upsert.
 *   - Never deletes anything.
 *   - Source of truth is src/lib/marketing/services.ts itself (imported
 *     directly, not retyped here) — no content is invented; anything that
 *     file doesn't have (processText/equipmentText/warrantyText/faq) is
 *     left null, to be filled in later via the admin UI, not guessed at
 *     here.
 *
 * IMPLEMENTATION NOTE: this deliberately does NOT import
 * src/server/repositories/prisma/service.prisma.ts or
 * src/server/db/client.ts — both transitively import the `server-only`
 * package, which (unlike its name suggests) throws unconditionally when
 * loaded outside a bundler-managed Server Component context — including a
 * plain `tsx` script. So this file constructs its own throwaway
 * PrismaClient the same minimal way db/client.ts does, instead of reusing
 * the app's singleton. The Service field mapping still mirrors
 * PrismaServiceRepository.create() exactly — see service.prisma.ts.
 *
 * Run with: npm run seed:services
 * (requires DATABASE_URL to be set, same as any other Prisma command —
 * see prisma.config.ts / README "Local development setup")
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SERVICES } from "../src/lib/marketing/services";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** One item per line — the same convention serviceCatalogue.ts's toLines() splits back apart on the public side. */
function toLines(items: string[]): string {
  return items.join("\n");
}

async function main() {
  let created = 0;
  let skipped = 0;

  for (const service of SERVICES) {
    const existing = await prisma.service.findUnique({ where: { slug: service.slug } });
    if (existing) {
      console.log(`skip  ${service.slug} — already exists, left untouched`);
      skipped++;
      continue;
    }

    await prisma.service.create({
      data: {
        slug: service.slug,
        name: service.name,
        shortDescription: service.shortDescription,
        quoteOnly: false,
        problemText: service.problem,
        solutionText: service.solution,
        suitableCustomersText: toLines(service.suitableFor),
        featuresText: toLines(service.components),
        processText: null,
        equipmentText: null,
        warrantyText: null,
        considerationsText: service.considerations,
        faq: undefined,
        seoTitle: null,
        seoDescription: null,
        status: "PUBLISHED",
      },
    });
    console.log(`create ${service.slug}`);
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already existed).`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
