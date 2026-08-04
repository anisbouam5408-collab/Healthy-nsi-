import "server-only";

import { sql } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PostgresJsTransaction } from "drizzle-orm/postgres-js";

import { getDb } from "./client";
import type * as schema from "./schema";

export type Tx = PostgresJsTransaction<typeof schema, ExtractTablesWithRelations<typeof schema>>;

/**
 * Runs `callback` inside a transaction with the Postgres session
 * variables `app.current_org_id` and `app.current_user_id` set for
 * that transaction only (`set_config(..., true)` — local to the
 * transaction, cleared on commit/rollback).
 *
 * Both are required, not just the org: `app_can_access_client` (the
 * function backing every clinical table's RLS policy) checks the
 * *user's* care-team assignment within the org, and several tables
 * (`users`, `practitioner_profiles`, `credential_verifications`) key
 * directly off the user. A context carrying an org but no user would
 * silently satisfy an org-only policy while failing every
 * care-team-scoped one — passing both together, always, is what
 * prevents that split-brain state from ever existing.
 *
 * This function is the *only* place in the codebase that should ever
 * set these variables, so tenant isolation has exactly one code path
 * to audit. Every server-side database access for an authenticated
 * request must go through this wrapper — querying `getDb()` directly,
 * outside of it, will see no rows on any RLS-protected table
 * (fail-closed), which is deliberate, not a bug to work around by
 * reaching for the raw client.
 */
export async function withOrgContext<T>(
  organizationId: string,
  userId: string,
  callback: (tx: Tx) => Promise<T>
): Promise<T> {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_org_id', ${organizationId}, true)`);
    await tx.execute(sql`select set_config('app.current_user_id', ${userId}, true)`);
    return callback(tx);
  });
}

/**
 * Same idea, for the narrow set of platform-admin code paths (support
 * tooling, the internal admin dashboard) that must legitimately read
 * across every organization. Deliberately a separate function rather
 * than an optional flag on `withOrgContext`, so every call site that
 * bypasses tenant isolation is visually obvious in a code review and
 * easy to grep for. `adminUserId` is still recorded — an admin session
 * bypassing tenant isolation must still be attributable to a specific
 * person in the audit log, not merely "admin mode was on."
 */
export async function withPlatformAdminContext<T>(
  adminUserId: string,
  callback: (tx: Tx) => Promise<T>
): Promise<T> {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.is_platform_admin', 'true', true)`);
    await tx.execute(sql`select set_config('app.current_user_id', ${adminUserId}, true)`);
    return callback(tx);
  });
}
