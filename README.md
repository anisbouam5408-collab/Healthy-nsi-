# Healthy NSI

The operating system for the modern nutrition practice — a premium SaaS platform for professional nutritionists and dietitians to plan, deliver, and grow their practice, with a client-facing portal built in from day one.

This repository is being built module by module, production-ready at each step. See progress and conventions below.

## Stack

- **Framework:** Next.js (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS v4, CSS-variable design tokens (`src/app/globals.css`)
- **UI primitives:** Radix UI + `class-variance-authority`, hand-built in `src/components/ui`
- **Database:** PostgreSQL + Drizzle ORM, with Row-Level Security enforcing multi-tenant isolation at the database layer (`src/lib/db`)
- **Validation:** Zod (including runtime environment validation, `src/lib/env.ts`)
- **Testing:** Vitest + React Testing Library, plus real-database integration tests for the RLS layer
- **Package manager:** pnpm

## Getting started

```bash
pnpm install
cp .env.example .env.local   # see "Database setup" below before filling this in
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the app, or [http://localhost:3000/style-guide](http://localhost:3000/style-guide) for the design system reference.

## Database setup

The schema uses PostgreSQL Row-Level Security as the primary tenant-isolation boundary — enforced by the database itself, not just by application query filters. That only works if the app connects as a **restricted, non-superuser role**; a superuser or `BYPASSRLS` role skips RLS entirely, silently turning every policy into a no-op. Local development mirrors production's two-role split:

1. A **migration role** (e.g. the default `postgres` superuser locally) that can create tables, functions, and policies. Only `drizzle-kit` uses this, via `MIGRATION_DATABASE_URL`.
2. An **app role** with plain `SELECT`/`INSERT`/`UPDATE`/`DELETE` privileges and no RLS bypass. The application connects as this role via `DATABASE_URL`, always.

```sql
-- Run once against your local database as a superuser:
CREATE ROLE healthy_nsi_app LOGIN PASSWORD 'healthy_nsi_app' NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO healthy_nsi_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO healthy_nsi_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO healthy_nsi_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO healthy_nsi_app;
```

Then in `.env.local`:

```bash
DATABASE_URL=postgresql://healthy_nsi_app:healthy_nsi_app@localhost:5432/healthy_nsi_dev
MIGRATION_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthy_nsi_dev
```

Run migrations with `pnpm db:migrate`. One migration (`drizzle/migrations/0000_*.sql`) contains hand-written additions after the generated SQL — four SQL functions (`app_current_org_id()`, `app_current_user_id()`, `app_is_platform_admin()`, `app_can_access_client()`) that every RLS policy calls. See the comments at their insertion point in that file, and `src/lib/db/schema/_helpers.ts`, before regenerating that migration from a schema change — the insertion needs to be re-applied by hand at the equivalent point (after the tables it references exist, before the first policy that calls it).

## Scripts

| Command                                         | Purpose                                     |
| ------------------------------------------------ | -------------------------------------------- |
| `pnpm dev`                                      | Start the dev server                        |
| `pnpm build`                                    | Production build                            |
| `pnpm lint`                                     | ESLint                                      |
| `pnpm typecheck`                                | TypeScript, no emit                         |
| `pnpm test`                                     | Run the test suite once (needs `DATABASE_URL` for db integration tests) |
| `pnpm test:watch`                               | Run tests in watch mode                     |
| `pnpm format`                                   | Format with Prettier                        |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Drizzle migration tooling (uses `MIGRATION_DATABASE_URL`) |

## Project structure

```
src/
  app/                 # Next.js App Router routes
    style-guide/        # design system visual reference
  components/
    ui/                 # design-system primitives (Button, Input, Card, ...)
  lib/
    db/
      schema/            # Drizzle tables, one file per domain (see below)
      schema.ts           # barrel export consumed by the db client and drizzle-kit
      client.ts            # lazy Drizzle/postgres-js client
      tenant-context.ts    # withOrgContext / withPlatformAdminContext — the only
                             #   place RLS session variables are ever set
      bootstrap.ts          # createOrganizationWithOwner / createUser — the one
                             #   place that must run *before* any RLS context exists
      rls.integration.test.ts  # tests against a real Postgres, not mocks
    env.ts               # validated environment access
    utils.ts             # cn() and shared helpers
  test/                  # test setup
```

The schema is organized by domain, mirroring the data model design: `organizations` (identity & org membership), `clients` (client core, households, care team), `clinical` (medical history, dietary restrictions), `metrics` (the unified time-series engine — body measurements, labs, vitals all in one place), `goals`, `consultations`, `tasks` (tasks/reminders/automation), `food` (the food & nutrient database), `programs` (the meal-plan builder core), `templates`, `documents`, `ai` (the AI provenance/approval layer), `tags`, `audit` (revisions + the append-only audit log), `consent`.

## Conventions

- Every color, radius, and shadow value is a CSS variable defined once in `globals.css` — never hardcoded in a component. This is what makes dark mode and future white-labeling config changes instead of rewrites.
- UI primitives are composed through `cn()` (`src/lib/utils.ts`), never raw string concatenation, so Tailwind class conflicts resolve predictably.
- Environment variables are read through `src/lib/env.ts`, never `process.env` directly — misconfiguration fails loudly at startup.
- Server-only modules (database client, tenant context, bootstrap) are marked with the `server-only` import guard to prevent accidental client bundling.
- Primary keys are application-generated UUIDv7 (`generateId()` / `idColumn()` in `schema/_helpers.ts`), not database defaults — time-ordered for index-friendly writes on high-volume tables, and known before insert, which is what makes `bootstrap.ts` possible at all.
- Every tenant-scoped table is protected by Postgres RLS, not just application-level query filters. All server-side database access must go through `withOrgContext` or `withPlatformAdminContext` (`tenant-context.ts`) — querying the raw client outside of them sees no rows on any protected table, by design.
- Clinical/business records are soft-deleted (`deletedAt`), never hard-deleted; the `audit_log` table has no update or delete policy at all, for anyone, so it can't be tampered with after the fact.
