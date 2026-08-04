import { sql } from "drizzle-orm";
import { pgPolicy, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

/**
 * Shared column building blocks, applied consistently across every
 * table in the schema. Centralizing these means a convention change
 * (e.g. how we soft-delete) is a one-file edit, not a hunt across
 * forty table definitions.
 */

/**
 * Generates a single UUIDv7 — exported standalone (not just wired into
 * `idColumn`'s default) because bootstrapping a brand-new organization
 * or user requires knowing the row's id *before* the insert executes,
 * to set RLS context first. See `../bootstrap.ts`.
 */
export function generateId() {
  return uuidv7();
}

/**
 * Primary key column: `uuid`, generated in the application layer as
 * UUIDv7 (time-ordered) rather than via Postgres's `gen_random_uuid()`
 * (UUIDv4, random). See Module 1's design notes for why — in short,
 * our highest-write tables (metric entries, audit log) benefit from
 * index-append-friendly, time-ordered primary keys, and generating
 * them in the application avoids depending on a specific Postgres
 * version or extension.
 */
export function idColumn() {
  return uuid("id").primaryKey().$defaultFn(generateId);
}

/**
 * `created_at` / `updated_at`, both timezone-aware (never store a
 * naive timestamp — this product is international by design).
 * `updated_at` is maintained by the application layer on write; a
 * database trigger is deliberately not used here to keep write paths
 * observable in application code and ORM-visible in query logs.
 */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
};

/**
 * Soft-delete marker. Applied to every clinical or business record
 * that must never be hard-deleted (client data, consultation notes,
 * programs, consent records, ...). `null` means "not deleted" — every
 * read path for these tables must filter on `deletedAt is null`
 * explicitly; there is no automatic global filtering, so this is
 * never silently forgotten by an ORM default.
 */
export const softDelete = {
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

/**
 * Every RLS policy in this schema reads request context through these
 * three SQL-level accessors (`app_current_org_id()`, `app_current_user_id()`,
 * `app_is_platform_admin()` — defined in a hand-written migration, see
 * `drizzle/migrations/0000_rls_helper_functions.sql`) rather than
 * calling `current_setting(...)::uuid` directly. That indirection
 * exists to fix a real bug the Module 1 integration suite caught:
 * Postgres connection pooling reuses physical backend connections
 * across logical requests, and once a custom GUC like
 * `app.current_org_id` has been *set* at least once on a given
 * connection, a later transaction that never sets it again reads back
 * an **empty string**, not NULL — so a raw `::uuid` cast throws
 * `invalid input syntax for type uuid` instead of evaluating to false.
 * The accessor functions apply `nullif(..., '')` before casting,
 * fixing that at the one place it can never be forgotten, instead of
 * requiring every policy (and everyone writing a new one later) to
 * remember the guard.
 */
// Note: no CURRENT_USER_ID constant here — none of the shared helpers
// below need a per-user check directly (client-level access is
// resolved through `app_can_access_client`). The tables that do need
// it directly (`users`, `practitioner_profiles`, `credential_verifications`,
// and `clients`' own policy) call `app_current_user_id()` inline in
// their hand-written policies in organizations.ts / clients.ts.
const CURRENT_ORG_ID = sql`app_current_org_id()`;
const IS_PLATFORM_ADMIN = sql`app_is_platform_admin()`;

/**
 * Standard tenant-isolation RLS policy for any table carrying an
 * `organization_id` column. Enforced at the database layer, not just
 * in application query-builders — the correct boundary for health
 * data, where an application-layer bug filtering the wrong org would
 * otherwise be a silent data breach rather than a blocked query.
 *
 * Read access (`using`) additionally allows a narrow, explicitly-set
 * platform-admin context to see across organizations (needed for the
 * future admin dashboard and support tooling). Write access
 * (`withCheck`) never allows that bypass — even an admin session must
 * write into a specific, correctly-scoped organization, never
 * ambiguously "wherever admin mode happens to be looking."
 *
 * Requires `withOrgContext()` (see `../tenant-context.ts`) to have set
 * `app.current_org_id` for the current transaction; otherwise this
 * evaluates to false — the fail-closed behavior we want.
 */
export function orgIsolationPolicy(tableName: string) {
  return pgPolicy(`${tableName}_org_isolation`, {
    for: "all",
    using: sql`organization_id = ${CURRENT_ORG_ID} or ${IS_PLATFORM_ADMIN}`,
    withCheck: sql`organization_id = ${CURRENT_ORG_ID}`,
  });
}

/**
 * Same policy, for the one table where the tenant-scoping column *is*
 * the primary key: `organizations` itself.
 */
export function selfOrgIsolationPolicy(tableName: string) {
  return pgPolicy(`${tableName}_org_isolation`, {
    for: "all",
    using: sql`id = ${CURRENT_ORG_ID} or ${IS_PLATFORM_ADMIN}`,
    withCheck: sql`id = ${CURRENT_ORG_ID}`,
  });
}

/**
 * RLS policy for tables scoped to an individual client (measurements,
 * goals, consultation notes, programs, appointments, ...) rather than
 * broadly to the organization. Delegates to the `app_can_access_client`
 * SQL function (same hand-written migration as the accessors above)
 * instead of repeating the same care-team-membership subquery on
 * every table — one definition of "who can see this client's data"
 * that every clinical table's policy calls, so that logic can never
 * drift out of sync between tables.
 *
 * The function itself (not this policy) is where the actual rule
 * lives: organization owners/admins see every client in their org;
 * other roles see only clients they're assigned to via
 * `care_team_assignments`. In Phase 1 (solo practitioners, one member
 * per org) those two conditions are equivalent — the distinction
 * starts mattering the moment Phase 2's multi-practitioner
 * organizations ship, and it costs nothing to have it correct now.
 */
export function clientScopedPolicy(tableName: string) {
  return pgPolicy(`${tableName}_client_scoped_access`, {
    for: "all",
    using: sql`app_can_access_client(client_id) or ${IS_PLATFORM_ADMIN}`,
    withCheck: sql`app_can_access_client(client_id)`,
  });
}

/**
 * RLS policies for catalog tables that mix a shared, platform-provided
 * baseline with per-organization extensions — the same pattern used
 * by `metric_definitions`: `organization_id IS NULL` rows are global
 * and visible to everyone (the public food database, platform-curated
 * templates); `organization_id` set means "this org's own addition,"
 * visible only there. One catalog, not two parallel tables for
 * "global" vs. "custom" — see Module 1's design notes on why that's a
 * deliberate simplification over treating them as separate concepts.
 */
export function globalOrOrgVisibilityPolicies(tableName: string) {
  return [
    pgPolicy(`${tableName}_visibility`, {
      for: "select",
      using: sql`organization_id is null or organization_id = ${CURRENT_ORG_ID} or ${IS_PLATFORM_ADMIN}`,
    }),
    pgPolicy(`${tableName}_org_insert`, {
      for: "insert",
      withCheck: sql`organization_id = ${CURRENT_ORG_ID} or ${IS_PLATFORM_ADMIN}`,
    }),
    pgPolicy(`${tableName}_org_update`, {
      for: "update",
      using: sql`organization_id = ${CURRENT_ORG_ID} or ${IS_PLATFORM_ADMIN}`,
    }),
  ];
}

/**
 * Hybrid policy for tables that are org-scoped but only *sometimes*
 * client-scoped (`clientId` nullable — `tasks`, `programs`,
 * `generated_documents`, `ai_generation_requests`): a client-less row
 * is visible to anyone in the org; a client-attached row additionally
 * requires `app_can_access_client`. Centralized here because four
 * different tables need exactly this same shape, and duplicating the
 * raw SQL across them is exactly the kind of drift risk the other
 * shared policy helpers above exist to prevent.
 */
export function orgAndOptionalClientScopedPolicy(tableName: string) {
  return pgPolicy(`${tableName}_org_and_client_scoped`, {
    for: "all",
    using: sql`
      ${IS_PLATFORM_ADMIN}
      or (
        organization_id = ${CURRENT_ORG_ID}
        and (client_id is null or app_can_access_client(client_id))
      )
    `,
    withCheck: sql`
      organization_id = ${CURRENT_ORG_ID}
      and (client_id is null or app_can_access_client(client_id))
    `,
  });
}
