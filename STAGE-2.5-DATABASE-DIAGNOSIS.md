# Securivon — Stage 2.5: Database Environment & Real Admin Activation

**Status:** Diagnostic and decision document. Per your explicit instruction, Steps 4–9 (Prisma activation, real Admin auth, route activation, integration tests) are **gated on Prisma actually working**, and Step 1's finding is that it cannot in this sandbox. This document stops after diagnosis and the database-provider recommendation, as instructed — no further code changes were made.

---

## Step 1 — Diagnosis (no guessing — every claim below was directly tested)

### Versions
- Prisma CLI: **7.9.1**
- `@prisma/client`: **7.9.1**
- Node: v22.22.2, npm: 10.9.7
- OS: Ubuntu 24.04.4 LTS, x86_64

### The exact failure
```
Error: Failed to fetch sha256 checksum at
https://binaries.prisma.sh/all_commits/e922089b7d7502aff4249d5da3420f6fa55fc6ad/debian-openssl-3.0.x/schema-engine.gz.sha256
- 403 Forbidden
```

### Root cause — confirmed, not inferred
I tested the exact HTTP request directly with `curl -D -` to capture response headers, not just the error Prisma reports:

```
HTTP/2 403
x-deny-reason: host_not_allowed
content-length: 105
content-type: text/plain

Host not in allowlist: binaries.prisma.sh. Add this host to your network egress settings to allow access.
```

**This is not a Prisma-side failure, a network outage, or a Prisma bug.** The `x-deny-reason: host_not_allowed` header is coming from this sandbox's own outbound network proxy, not from Prisma's servers. DNS resolution for `binaries.prisma.sh` succeeds normally (resolves to Cloudflare-fronted `r2.prisma.sh`), confirming the domain itself is healthy — it's specifically excluded from this sandboxed agent environment's network egress allowlist, the same allowlist that permits `registry.npmjs.org`, `github.com`, `pypi.org`, and a fixed set of other package/source-code hosts, but nothing else.

### Is this specific to this environment?
**Yes, confirmed.** This is an intentional, configured restriction of the sandbox this agent runs in — not a general internet-wide Prisma outage, not a Prisma architecture problem, and not something wrong with your project. A normal developer machine or a standard CI runner (GitHub Actions, Vercel's build environment, etc.) has no reason to block this host and will almost certainly reach it without any special configuration.

### Can Prisma use an existing local cache?
No. I checked `/root/.cache/prisma` (Prisma's own documented engine cache location, confirmed via `prisma debug`) — it exists only as empty directory scaffolding created by earlier failed download attempts in this same sandbox. No engine binary has ever successfully been cached here.

### Are engines available via npm instead of binaries.prisma.sh?
I checked this directly, since `registry.npmjs.org` **is** in this sandbox's allowlist. Historically (Prisma 2.x–4.x), engine binaries were distributed as platform-specific npm packages. **That is no longer true in Prisma 7.** The `@prisma/engines` npm package (verified via the public npm registry API) contains only orchestration code — it depends on `@prisma/fetch-engine`, whose entire job is to download the actual binary from `binaries.prisma.sh` at install/generate time. There is no npm-distributed fallback for the compiled engine itself in this Prisma version.

### Is there a supported alternative that avoids the network call entirely?
**Partially, and this is the most useful finding of this diagnosis.** Prisma 7 ships a bundled **WASM query compiler** locally (found at `node_modules/prisma/build/query_compiler_*.wasm`, including a `postgresql` variant) — this is part of Prisma's newer "driver adapters" architecture and requires no network access. However, this only covers the **query execution** engine. The **schema engine** (used by `prisma validate`, `prisma generate`'s schema-parsing step, and `prisma migrate`) is a separate native binary in this Prisma version, and I could not find a bundled WASM equivalent for it — every code path I tested (`validate`, `generate`, `generate --no-engine`, with `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` set) still attempted to fetch the schema engine from `binaries.prisma.sh` first and failed identically.

### The legitimate override that exists (documented by Prisma itself)
Running `prisma debug` surfaces `PRISMA_ENGINES_MIRROR` as an officially supported environment variable — Prisma explicitly supports redirecting engine downloads to a different, self-hosted or approved mirror URL instead of the default `binaries.prisma.sh`. **This is a real, legitimate, non-architecture-weakening solution** — but it only helps if the mirror host you point at is itself reachable from wherever the command runs. In this sandbox, I don't control the network allowlist and have no alternate mirror host that happens to already be permitted, so this doesn't unblock me here. On your own machine or in a standard CI environment, you almost certainly won't need this variable at all, since the default host will simply work.

### Conclusion
The problem is solvable — **just not inside this specific sandboxed session.** Nothing about Prisma, your schema, or this project's architecture is at fault. I have not weakened the architecture, removed Prisma, or introduced a substitute ORM.

---

## Step 2 — Local Development Requirements (exact commands for your machine)

Once you're on a normal developer machine or CI environment (not this sandbox), the following will work as documented, with no special flags needed:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then fill in a real DATABASE_URL — see Step 3 for the recommended provider

# 3. Generate the Prisma Client (needs network access to binaries.prisma.sh — normal on any standard machine)
npx prisma generate

# 4. Validate the schema
npx prisma validate

# 5. Create and apply the initial migration against your dev database
npx prisma migrate dev --name init

# 6. (Optional) Browse your data visually
npx prisma studio

# 7. (Optional, once seed data exists) Seed the development database
npx prisma db seed
```

**If, and only if, your own network also blocks `binaries.prisma.sh`** (e.g. a locked-down corporate firewall) — set `PRISMA_ENGINES_MIRROR` to an approved mirror URL before running the commands above. This should not be necessary for the overwhelming majority of developer machines or CI providers.

---

## Step 3 — Database Provider Recommendation

Evaluated against your criteria (cost, free/low-cost dev availability, Postgres/Prisma compatibility, backups, reliability, ease of setup, Pakistan accessibility, production scalability, migration difficulty), based on current, verified 2026 pricing and product information:

| Option | Fit for Securivon |
|---|---|
| **Neon** | ✅ Recommended — see below |
| Supabase | Bundles auth, storage, realtime, and edge functions Securivon doesn't need (we already built custom Admin auth in Stage 1/2) — extra platform surface area for no benefit. Free tier is comparable but the paid tier ($25/mo minimum) buys a lot of unused product. |
| Railway | App + database on one platform is appealing, but you own more database operations yourself, and its free tier is more constrained than Neon's or Supabase's. |
| AWS RDS / Google Cloud SQL | Enterprise-grade, but real infrastructure overhead (VPC/networking setup, no genuinely free tier) — disproportionate for a project at this stage. Explicitly what "do not introduce unnecessary infrastructure" warns against right now. |
| CockroachDB / Yugabyte | Multi-region distributed SQL — solves a scaling problem Securivon doesn't have, at the cost of losing some native Postgres compatibility. Not appropriate here. |
| PlanetScale (Postgres) | Strong production option, but positioned/priced for scale Securivon isn't at yet. |

### Recommendation: **Neon**

- **Prisma compatibility:** Neon is one of the most common Prisma pairings in the ecosystem and has first-class Vercel integration — directly matching the Vercel deployment target already recommended in Phase 4.
- **Cost:** Genuinely free tier with no time-boxed trial expiry (verified current as of mid-2026) — appropriate for Securivon's current stage. Compute scales to zero when idle, so a low-traffic new-business site doesn't accrue meaningful cost.
- **No unnecessary infrastructure:** Pure Postgres, no bundled auth/storage/realtime platform Securivon doesn't need — you already have a working, tested Admin auth system (Stage 1/2), so paying for or configuring a redundant auth product would be wasted surface area.
- **Ease of setup:** A `DATABASE_URL` connection string is all `schema.prisma`'s `datasource db` block needs — no VPC, no networking configuration.
- **Backups:** Point-in-time recovery included on paid tiers; free tier is appropriate for development, not for production data — **when Securivon has real customer/lead data, budget for at least Neon's entry paid tier specifically for backup coverage**, flagged here as a decision point for later, not a free-tier-forever assumption.
- **Pakistan accessibility:** Neon's infrastructure runs on major cloud regions (AWS-backed); there's no Pakistan-specific outage risk beyond normal international connectivity, and since this traffic is server-to-database (Vercel's edge to Neon), not customer-to-database directly, Pakistani end-user latency to the *website* is unaffected by where the database region sits.
- **Migration difficulty:** Standard Postgres — `pg_dump`/`pg_restore` compatible if you ever need to move providers later; no lock-in beyond a normal Postgres connection string.

**No second option is being proposed alongside this** per your instruction to recommend one unless there's a strong reason for alternatives — there isn't one here.

---

## Step 4 — Prisma Activation

**Not performed.** Per your explicit instruction ("If the Prisma/network problem cannot be solved in the current environment, STOP... Do not fabricate success"), and since Step 1 confirmed the blocker is unresolvable inside this sandbox, I did not attempt to run generate/validate/migrate again beyond the diagnostic tests in Step 1 (all of which failed identically, as expected). `src/server/db/client.ts` and its `tsconfig.json` exclusion remain in place, unchanged — removing that exclusion now would break the build, since the generated client still doesn't exist.

---

## Step 5 — Real Admin Auth

**Not performed**, for the same reason — this step explicitly depends on Prisma working. The env-bootstrap `AdminUserRepository` (Stage 1) remains the active implementation. The real `PrismaAdminUserRepository` (Stage 2) remains written, complete, and unwired, exactly as it was left at the end of Stage 2.

---

## Step 6 — Activate Admin Routes

**Not performed**, for the same reason. `src/server/adminRoutes/*.ts` remain outside `src/app/`, unmounted, exactly as documented in Stage 2's README section.

---

## Step 7 — Database Testing

**Not performed** — there is no reachable database to test against. The existing 99 unit tests (Stage 1: 51, Stage 2: +48) remain untouched and passing; no integration tests were added this stage, since writing integration tests against a database connection that cannot be established here would either fail honestly (acceptable, but adds no information beyond what Step 1 already established) or require fabricating a result, which you explicitly instructed against.

---

## Step 8 — Seed Data

**Not created this stage.** Seed data is only meaningful once there's a real database to seed against and Prisma Client is generated (`prisma db seed` depends on the generated client). When this becomes possible, seed records will follow the labeling convention already established throughout this project (e.g. `"DEMO PRODUCT — NOT FOR PRODUCTION"`, `pricingStatus: "NEEDS_REVIEW"` never `"VERIFIED"` on demo records) — this convention is already encoded in the test fixtures under `test/fakes/` and `*.test.ts` files from Stage 2, so the pattern is established even though no seed script exists yet.

---

## Step 9 — Security Verification

Everything in this list **that doesn't require a live database** was already verified in Stage 2 and re-confirmed still passing now:

| Check | Status |
|---|---|
| Supplier costs cannot be returned by public endpoints | ✅ Verified — `toPublicProduct`/`toPublicSupplier` allowlist serializers, unit-tested (`product.test.ts`, `supplierIsolation.test.ts`) |
| Admin-only data cannot be accessed anonymously | ✅ Verified — `src/proxy.ts` protects `/admin/*` and `/api/admin/*`; unauthenticated requests redirect/401 |
| Pricing cannot be modified without Admin authorization | ✅ Verified at the logic level — every write path in `src/server/services/*` and `src/server/adminRoutes/*` runs through `withAdminAuth`; **not** verified end-to-end against a real database yet, since the routes aren't mounted |
| Audit logs cannot be modified by normal Admin UI actions | ✅ By design — `PricingAuditLogRepository` interface only exposes `create`/`listForEntity`/`listRecent`, no `update`/`delete` method exists anywhere in the codebase |
| Password hashes never appear in API responses | ✅ Verified — `AdminSessionPayload` never includes `passwordHash`; `authenticateAdmin` returns it internally but no route handler forwards it |
| Environment secrets are not committed | ✅ Verified — `git status` clean of any `.env`/`.env.local`; only `.env.example` (placeholders) is tracked |

---

## Final Validation

| Check | Result |
|---|---|
| Unit tests | ✅ 99/99 passing (unchanged from Stage 2 — no regressions) |
| Integration tests | ⛔ Not run — no reachable database |
| Typecheck | ✅ 0 errors |
| Lint | ✅ 0 errors/warnings |
| `prisma generate` | ❌ Fails — `binaries.prisma.sh` blocked (Step 1) |
| `prisma validate` | ❌ Fails — same root cause |
| `prisma migrate dev` | ❌ Not attempted — depends on generate succeeding first |
| Production build | ✅ Succeeds — 21 routes, clean |

---

## Summary — What You Need To Do

1. **Root cause:** This sandbox's own network egress allowlist blocks `binaries.prisma.sh` (confirmed via direct HTTP response header, not inferred). Not a Prisma bug, not an internet-wide outage, not a flaw in this project.
2. **Recommended database:** **Neon** — free tier for now, budget for its entry paid tier once real customer/lead data exists (for backup coverage).
3. **On your own machine:** run the seven commands listed in Step 2, in order. They should work with no special configuration on a normal developer laptop or standard CI provider.
4. **Prisma status:** Not operational in this sandbox; architecture is untouched and correct, ready to activate the moment `prisma generate` succeeds somewhere with normal network access.
5. **Database status:** No live database connection established or possible here.
6. **Admin authentication status:** Env-bootstrap (Stage 1) remains the active path; real Prisma-backed implementation is written and waiting, not yet swapped in.
7. **Admin API status:** Real route logic complete in `src/server/adminRoutes/*.ts`, not yet mounted at `src/app/api/admin/...` — exact activation steps are documented in the README and in Stage 2's report.
8. **Integration-test results:** None — no database to test against.
9. **Remaining blockers:** Exactly one — network access to `binaries.prisma.sh`, which is specific to this sandbox and should not recur once you run these same commands on your own machine or a standard CI environment.

**Stopping here, as instructed.** No Stage 3, no public-facing features, no deployment. The next real step is on your side: run `npx prisma generate` on a machine with normal network access and let me know once it succeeds — at that point Steps 4–9 above become directly actionable, using the exact code already written and waiting in this repository.
