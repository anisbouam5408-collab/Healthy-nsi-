import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "./client";
import { generateId } from "./schema/_helpers";
import { organizationMembers, organizations, users } from "./schema";

export interface CreateOrganizationWithOwnerInput {
  organizationName: string;
  organizationSlug: string;
  ownerEmail: string;
  ownerFullName: string;
}

/**
 * Creates a brand-new organization, its first user, and the owner
 * membership linking them — the one bootstrap operation in the whole
 * schema that RLS context can't precede, because there is no
 * organization or user yet to derive that context from.
 *
 * This deserves its own documented function rather than leaving every
 * future caller (starting with Module 2's signup flow) to rediscover
 * the same subtlety independently. Two things make it work, together:
 *
 * 1. IDs are generated here, in application code, *before* any insert
 *    runs — only possible because Module 1 made primary keys
 *    application-generated UUIDv7s rather than database defaults. That
 *    lets us set `app.current_org_id` / `app.current_user_id` to the
 *    row's own id *before* creating the row.
 * 2. Postgres evaluates a table's SELECT-level `USING` policy against
 *    the newly-written row whenever `INSERT ... RETURNING` is used —
 *    not just the `WITH CHECK` policy — and raises exactly the same
 *    "new row violates row-level security policy" error if that
 *    fails, rather than silently omitting the row. Every insert in
 *    this codebase uses `.returning()`, so setting context to the
 *    pre-generated id first isn't an optimization, it's required for
 *    the insert to succeed at all. (Discovered by the Module 1
 *    integration test suite, not by inspection — see
 *    `rls.integration.test.ts`.)
 *
 * Everything after this function runs through `withOrgContext` like
 * any other org-scoped operation.
 */
export async function createOrganizationWithOwner(input: CreateOrganizationWithOwnerInput) {
  const organizationId = generateId();
  const ownerId = generateId();

  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_org_id', ${organizationId}, true)`);
    await tx.execute(sql`select set_config('app.current_user_id', ${ownerId}, true)`);

    const [organization] = await tx
      .insert(organizations)
      .values({ id: organizationId, name: input.organizationName, slug: input.organizationSlug })
      .returning();

    const [owner] = await tx
      .insert(users)
      .values({ id: ownerId, email: input.ownerEmail, fullName: input.ownerFullName })
      .returning();

    const [membership] = await tx
      .insert(organizationMembers)
      .values({ organizationId, userId: ownerId, role: "owner", joinedAt: new Date() })
      .returning();

    return { organization, owner, membership };
  });
}

export interface CreateUserInput {
  email: string;
  fullName: string;
}

/**
 * Creates a standalone user account not yet tied to any organization
 * — the same "no context can precede this row" situation as
 * `createOrganizationWithOwner`, just for a single table. Used both
 * for a person's very first signup (before they've created or joined
 * an org) and, later, as the identity half of inviting an existing
 * user into a second organization. Adding that user as a member of a
 * specific org is a separate step through `withOrgContext`, exactly
 * like attaching an owner's membership after `createOrganizationWithOwner`.
 */
export async function createUser(input: CreateUserInput) {
  const userId = generateId();
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_user_id', ${userId}, true)`);
    const [user] = await tx
      .insert(users)
      .values({ id: userId, email: input.email, fullName: input.fullName })
      .returning();
    return user;
  });
}
