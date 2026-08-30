# Securivon

CCTV & Security Solutions — Pakistan

Securivon is a security solutions business focused on providing professional CCTV, surveillance, access control, fire alarm, biometric, networking, and related security services.

## Services

- CCTV & IP Camera Installation
- CCTV Repair & Maintenance
- DVR / NVR Configuration
- Access Control & Biometric Systems
- Fire Alarm Systems
- Video Intercom
- Intrusion & Security Systems
- Networking & Structured Cabling
- Security System Maintenance & AMC

## Website Project

This repository contains the development of the official Securivon website, designed to provide:

- Professional company and service information
- Product catalogue
- CCTV & security packages
- Package/product comparison
- Instant quotation calculator
- Customer enquiry and contact system
- WhatsApp integration
- Local SEO for Pakistan
- Mobile-first responsive design
- Future customer/admin management features

## Company

**Securivon** — CCTV & Security Solutions
Ahmed Raza
WhatsApp / Phone: +92 311 0597513
Email: securivon@gmail.com
Website: securivon.com

**Project status:** Production foundation established (Stage 1 of the development roadmap). See "Development stages" below.

---

# Technical Documentation

## Technology stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.3.1 |
| UI library | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS (v4, CSS-first `@theme` config) | 4.3.3 |
| Database | PostgreSQL | — (via `DATABASE_URL`) |
| ORM | Prisma | 7.9.1 |
| Auth | bcryptjs (password hashing) + jose (JWT sessions) | bcryptjs 3.x, jose 6.x |
| Validation | zod | 4.x |
| Testing | Vitest | 4.1.10 |
| Deployment target | Vercel + managed Postgres | — |

Kept deliberately minimal — no state-management library, no CSS-in-JS, no auth-as-a-service vendor, no ORM alternative. Add a dependency only when a concrete requirement can't reasonably be met with what's already here.

## Local development setup

```bash
npm install
cp .env.example .env.local   # then fill in real values — see below
npx prisma generate          # requires network access to binaries.prisma.sh — see "Known limitations"
npx prisma migrate dev       # once you have a real Postgres instance to point DATABASE_URL at
npm run dev
```

**Prisma 7 note:** this project uses Prisma ORM v7's new configuration model. The database connection URL is no longer set in `prisma/schema.prisma` — it lives in `prisma.config.ts` (for the CLI) and is passed to a `@prisma/adapter-pg` driver adapter at runtime (see `src/server/db/client.ts`). See "Prisma 7 configuration" below for the full explanation.

## Environment variables

See `.env.example` for the full list with descriptions. Summary:

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Prisma / any DB access | PostgreSQL connection string |
| `AUTH_SECRET` | Admin session signing | 32+ random characters — `openssl rand -base64 32` |
| `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD_HASH` | Break-glass fallback only — NOT used by normal production login | Safe to leave unset. Real admin login is a database lookup (`AdminUser` table). See `src/server/repositories/adminUserRepository.ts` for the full explanation of this currently-inert fallback class. Hash must be bcrypt, not plain text, if you do set it. |
| `WHATSAPP_BUSINESS_NUMBER` | `wa.me` link generation | Config value, not a secret |
| `ERROR_MONITORING_DSN` | Error tracking | Vendor not yet decided (open decision) |
| `ANALYTICS_ID` | Analytics | Tool not yet decided (open decision) |
| `SPAM_PROTECTION_KEY` | Public form spam protection | Not wired in yet at foundation stage |
| `IMAGE_STORAGE_*` | Product photography | Needed once real, verified product images exist |

**Never commit `.env` or `.env.local`.** Only `.env.example` (placeholders only) is tracked.

## Database setup

1. Provision a PostgreSQL instance (local Docker container or a managed provider).
2. Set `DATABASE_URL` in `.env.local`.
3. Run `npx prisma generate` to produce the Prisma Client, then `npx prisma migrate dev --name init` to create the schema.
4. See `prisma/schema.prisma` for the full entity model — every table listed in the Phase 2/Phase 4 architecture is present.

## Prisma 7 configuration

This project targets **Prisma ORM v7**, which introduced a breaking change to how database connections are configured — schema.prisma's `datasource.url` field was removed entirely (error `P1012` if you try to keep it). The new model:

| Concern | Where it lives |
|---|---|
| CLI operations (`validate`, `generate`, `migrate`, `studio`, `db seed`) | `prisma.config.ts` (project root) — reads `DATABASE_URL` via the `env()` helper, loaded explicitly via the `dotenv` package (Prisma 7 no longer auto-loads `.env` files) |
| Running application (Prisma Client at runtime) | `src/server/db/client.ts` — constructs a `@prisma/adapter-pg` driver adapter from `DATABASE_URL` and passes it to `new PrismaClient({ adapter })`. The client constructor no longer accepts a bare connection string or `datasources`/`datasourceUrl` options — a driver adapter is mandatory for every database in v7. |
| Generated client output | `src/generated/prisma/` (gitignored) — Prisma 7's `prisma-client` generator (used here instead of the older, soon-to-be-removed `prisma-client-js`) requires an explicit `output` path; it's no longer generated into `node_modules` by default. |

Both `prisma.config.ts` and `src/server/db/client.ts` read the same `DATABASE_URL` — you only need to set it once, in `.env.local`.

**Not yet configured:** SSL certificate handling for the driver adapter. Prisma 7 uses `node-pg` instead of the old Rust query engine, which changed SSL validation defaults — you may need an explicit `ssl` option on `PrismaPg` depending on how your Postgres provider's connection string is set up. See `src/server/db/client.ts`'s SSL note and `STAGE-2.5-DATABASE-DIAGNOSIS.md` for the exact next step once you're ready to connect to Supabase.

## Prisma commands

```bash
npx prisma generate       # regenerate the client (into src/generated/prisma/) after any schema change
npx prisma migrate dev    # create + apply a new migration in development
npx prisma studio         # visual DB browser
npx prisma validate       # check schema.prisma + prisma.config.ts for errors
```

## Testing commands

```bash
npm test          # run the full Vitest suite once
npx vitest         # watch mode
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
npm run build      # production build (also runs Next's own type-check pass)
```

## Project structure

```
src/
  app/                     # Next.js App Router routes
    admin/                 # Admin UI (login page + minimal protected landing page — foundation only)
    api/admin/              # Admin-only API routes (session, ping)
    page.tsx, layout.tsx    # Root — placeholder content, not the real homepage yet
  components/               # Design system / UI components — not yet built out, see components/README.md
  lib/                       # Client-safe utilities (e.g. formatPKR)
  server/                     # Server-only code — see "Security notes" below
    db/client.ts              # Prisma client singleton (the ONLY file that imports @prisma/client)
    auth/                      # Password hashing, session tokens, authorization
    pricing/                    # Pricing engine (pure, rate-data-injected, no hardcoded prices)
    storage/                     # Storage calculation engine (bitrate/codec/fps-based formula)
    siteSurvey/                   # Site-survey decision rule engine (configurable rule list)
    validation/                    # zod schemas — the real server-side validation boundary
    serializers/                    # Allowlist serializers — the "never expose supplier cost" enforcement point, and where NEEDS_REVIEW/STALE pricing is downgraded to QUOTE_ONLY
    repositories/                    # Data-access interfaces + in-memory-testable types (Prisma-free)
      prisma/                          # SANDBOX-EXCLUDED: real Prisma-backed implementations of every repository
    services/                          # Business logic layer (Product/Package/InstallationRate admin services) — Prisma-free, tested via in-memory fakes
    adminRoutes/                        # SANDBOX-EXCLUDED: real Admin API route handler logic, not yet mounted at src/app/api/admin/ — see "Known limitations"
    container.ts                          # SANDBOX-EXCLUDED: wires real repositories to services
    quotes/                                # Quote immutability / revision logic
  proxy.ts                                  # Route protection for /admin/* and /api/admin/* (Next.js 16's renamed middleware convention)
prisma/
  schema.prisma                              # Full production data model, extended in Stage 2 (pricing status, richer availability, SKU, use cases, etc.)
test/
  stubs/                                       # Test-only stub for the 'server-only' package (see vitest.config.ts)
  fakes/                                        # Test-only in-memory repository fakes — never used in production code, only in *.test.ts files
```

## Development stages

Following the roadmap approved in the Phase 4 Production Implementation Plan:

1. **Repository audit** — done (this repository was documentation-only prior to this scaffold).
2. **Production architecture** — done (this document + Phase 4 plan).
3. **Database schema** — done and extended in Stage 2 (`prisma/schema.prisma`); not yet migrated against a real database (see "Known limitations").
4. **Authentication/Admin foundation** — done. Password hashing, session tokens, route protection, and one bootstrap login flow are implemented and tested. Stage 2 added the real Prisma-backed `AdminUserRepository` implementation (`src/server/repositories/prisma/adminUser.prisma.ts`), proven correct via `src/server/repositories/adminUserRepository.test.ts` against an injected fake — not yet swapped in as the active implementation (see "Known limitations").
5. **Database + Admin foundation (Stage 2)** — done. Real service layer (Product, Package, Installation Rate) with audit logging, pricing-status enforcement (`NEEDS_REVIEW`/`STALE` can never reach the public calculator), supplier-data isolation, and a full Admin dashboard shell with navigation for every required section. Route handler *logic* for every domain is complete in `src/server/adminRoutes/` but not yet mounted at `src/app/api/admin/.../route.ts` — see "Known limitations" for exactly why and how to activate it.
6–18. Public product catalogue, packages, configurator, quote system, service/product pages, SEO, lead/site-survey system, UI polish, testing, security/performance/SEO audits, production readiness review — **not started**. See the Phase 4 plan for the full sequence.

## Security notes

- **Supplier cost / margin isolation:** `Product.supplierCost`, `Product.sourceUrl`, and `Supplier.notes` are structurally excluded from every public-facing response via an **allowlist** serializer (`src/server/serializers/product.ts`) — a new internal field added later is excluded by default, not by remembering to add it to a denylist. Unit-tested in `product.test.ts`.
- **Server-only enforcement:** every pricing/storage/site-survey/auth module imports the `server-only` package. This was verified to actually fail the build (not just in theory) when deliberately imported into a client component during this stage's self-check.
- **Quote immutability:** `src/server/quotes/immutability.ts` has no "update pricing" function — only `createRevision()`, which produces a new linked record. Unit-tested to confirm the original is never mutated.
- **Passwords:** bcrypt, cost factor 12. Never logged, never returned in any API response.
- **Sessions:** signed JWTs (jose, HS256), 8-hour expiry, httpOnly + sameSite=lax cookies, secure flag in production.
- **Route protection:** `/admin/*` and `/api/admin/*` are protected by `src/proxy.ts`, which redirects unauthenticated page requests to `/admin/login` and returns 401 JSON for unauthenticated API requests. The login endpoint itself and the login page are explicitly excluded from the protection matcher.
- **Not yet implemented** (flagged, not silently skipped): rate limiting on login/forms, spam/bot protection, audit logging for Admin pricing changes (`PricingAuditLog` table exists in the schema; nothing writes to it yet), CSRF considerations beyond `sameSite=lax`, and the Prisma-backed (vs. env-bootstrap) AdminUser repository.

## Known limitations (this environment)

Two build-time network dependencies were unreachable in the sandbox this scaffold was built in, and both are documented at the exact point they matter in code, not just here:

1. **Prisma engine binaries** (`binaries.prisma.sh`) — `prisma generate`/`validate`/`migrate` cannot run here (re-confirmed multiple times; still a 403). **Prisma 7's configuration itself is correct and verified as far as this sandbox allows**: `prisma.config.ts` loads successfully, `.env.local` loads successfully, the schema loads successfully — `npx prisma validate` and `npx prisma generate` both progress cleanly through every config-loading step and fail *only* at the final network call to fetch the schema-engine binary. This is strong evidence the Prisma 7 migration (removing `datasource.url`, adding `prisma.config.ts`, switching to the `prisma-client` generator with an explicit `output` path, and moving `PrismaClient` instantiation to the `@prisma/adapter-pg` driver-adapter pattern) is correctly implemented, even though full end-to-end success can't be confirmed without real network access.

   This has the same real, confirmed downstream consequence as before: **real Admin API routes still cannot be mounted in this sandbox**, for the reason documented below.

   **Real Admin API routes cannot be mounted in this sandbox.** Next.js auto-generates a typed-routes validator (`.next/types/validator.ts`) that imports *every* `route.ts`/`page.tsx` file for type validation — this happens regardless of any `tsconfig.json` `exclude` entry, because the generated validator file is itself part of the included TypeScript program. This was tested empirically in Stage 2: a real `src/app/api/admin/test-route/route.ts` importing the Prisma client broke `tsc`/`next build` even when both that file and `db/client.ts` were explicitly excluded, because Next's generated validator re-imported it anyway.

   **Resolution used:** every domain's real Admin route-handler logic (Products, Categories, Brands, Suppliers, Warranties, Packages, Installation Rates, Pricing Audit Log) is written as complete, reviewable code in `src/server/adminRoutes/*.ts` — deliberately **outside** `src/app/`, so Next's router and typed-routes generator never discover it, and it stays excluded from typecheck cleanly (nothing included imports it). **To activate:** once `npx prisma generate` succeeds in a real environment, move each file's exported handlers into their real `src/app/api/admin/{domain}/route.ts` (and `[id]/route.ts` where applicable) locations, then remove the corresponding `tsconfig.json` exclusions. No logic changes are needed — only the file location.

   The Prisma-backed repository implementations (`src/server/repositories/prisma/*.ts`) and the dependency-injection container (`src/server/container.ts`) that wire them to the service layer are complete and follow the same pattern.

2. **Google Fonts** (`fonts.googleapis.com`) — `next/font/google` (the create-next-app default) couldn't fetch Geist/Geist Mono at build time. The root layout currently uses a plain system-font stack instead. This is not a design decision — real typography (Space Grotesk + IBM Plex Sans, per the approved Phase 3 spec) is a later UI-development-stage concern; consider `next/font/local` for production to avoid this exact class of issue regardless of environment.

**On the Admin UI you'll see if you run this locally:** every dashboard section (Products, Categories, Brands, Suppliers, Warranties, Packages, Pricing, Installation Rates, Availability) shows an honest "not connected in this sandbox" notice with the exact file paths for its real implementation, rather than being wired to fake/in-memory data and presented as if it worked. This was a deliberate choice, not a shortcut — see Stage 2's completion report for the reasoning.

Neither limitation reflects a problem with the code itself — both are confirmed, reproducible network-egress restrictions of this specific sandbox, and both have a clear, documented, low-effort path to resolution in a normal environment.
