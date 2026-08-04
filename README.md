# Healthy NSI

The operating system for the modern nutrition practice — a premium SaaS platform for professional nutritionists and dietitians to plan, deliver, and grow their practice, with a client-facing portal built in from day one.

This repository is being built module by module, production-ready at each step. See progress and conventions below.

## Stack

- **Framework:** Next.js (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS v4, CSS-variable design tokens (`src/app/globals.css`)
- **UI primitives:** Radix UI + `class-variance-authority`, hand-built in `src/components/ui`
- **Database:** PostgreSQL + Drizzle ORM (schema lands in Module 1)
- **Validation:** Zod (including runtime environment validation, `src/lib/env.ts`)
- **Testing:** Vitest + React Testing Library
- **Package manager:** pnpm

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in DATABASE_URL once Module 1 lands
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the app, or [http://localhost:3000/style-guide](http://localhost:3000/style-guide) for the design system reference.

## Scripts

| Command                                         | Purpose                   |
| ----------------------------------------------- | ------------------------- |
| `pnpm dev`                                      | Start the dev server      |
| `pnpm build`                                    | Production build          |
| `pnpm lint`                                     | ESLint                    |
| `pnpm typecheck`                                | TypeScript, no emit       |
| `pnpm test`                                     | Run the test suite once   |
| `pnpm test:watch`                               | Run tests in watch mode   |
| `pnpm format`                                   | Format with Prettier      |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Drizzle migration tooling |

## Project structure

```
src/
  app/                 # Next.js App Router routes
    style-guide/        # design system visual reference
  components/
    ui/                 # design-system primitives (Button, Input, Card, ...)
  lib/
    db/                  # Drizzle client + schema
    env.ts               # validated environment access
    utils.ts             # cn() and shared helpers
  test/                  # test setup
```

## Conventions

- Every color, radius, and shadow value is a CSS variable defined once in `globals.css` — never hardcoded in a component. This is what makes dark mode and future white-labeling config changes instead of rewrites.
- UI primitives are composed through `cn()` (`src/lib/utils.ts`), never raw string concatenation, so Tailwind class conflicts resolve predictably.
- Environment variables are read through `src/lib/env.ts`, never `process.env` directly — misconfiguration fails loudly at startup.
- Server-only modules (database client) are marked with the `server-only` import guard to prevent accidental client bundling.
