import { defineConfig } from "drizzle-kit";

/**
 * Deliberately reads `MIGRATION_DATABASE_URL`, not `DATABASE_URL`.
 *
 * `DATABASE_URL` (used by `src/lib/db/client.ts`, the app's runtime
 * connection) points at a restricted role with plain DML privileges
 * and no RLS bypass — the whole point of Module 1's tenant-isolation
 * design is that RLS is enforced even if application code has a bug.
 * Running migrations needs a privileged role that can create tables
 * and policies, which is a different credential with a different
 * blast radius, so it gets a different environment variable rather
 * than silently reusing the app's connection string. Falls back to
 * `DATABASE_URL` only so a fresh clone with just one Postgres URL
 * configured isn't immediately broken — production must set both,
 * pointing at different roles.
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
