// @vitest-environment node
/**
 * Integration tests against a real Postgres instance — not mocks.
 * These exist specifically to stress-test the RLS/tenant-isolation
 * architecture designed in Module 1, which is exactly the kind of
 * thing that looks correct in a schema review and is wrong in
 * practice (a subtly wrong `current_setting` call, a policy that
 * silently doesn't apply, a superuser connection masking a real bug).
 *
 * Requires `DATABASE_URL` to point at a *non-superuser* role (see
 * `.env.example`) — a superuser bypasses RLS entirely, which would
 * make every test in this file pass trivially without proving
 * anything. `beforeAll` asserts this explicitly rather than trusting
 * the environment silently.
 */
import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { createOrganizationWithOwner, createUser } from "./bootstrap";
import { getDb } from "./client";
import { withOrgContext, withPlatformAdminContext } from "./tenant-context";
import {
  auditLog,
  careTeamAssignments,
  clients,
  dietaryRestrictions,
  foods,
  foodSources,
  mealItems,
  meals,
  organizationMembers,
  programDays,
  programs,
} from "./schema";

const db = getDb();

// Every test creates its own fresh organizations/users rather than
// relying on a shared fixture reset between tests — with RLS, "clean
// slate per test" is naturally achieved by tenant isolation itself,
// so a truncate-between-tests step isn't needed the way it would be
// without row-level security.

describe("RLS / tenant isolation (Module 1 stress test)", () => {
  beforeAll(async () => {
    const [{ rolsuper, rolbypassrls }] = (await db.execute(
      sql`select rolsuper, rolbypassrls from pg_roles where rolname = current_user`
    )) as unknown as { rolsuper: boolean; rolbypassrls: boolean }[];
    if (rolsuper || rolbypassrls) {
      throw new Error(
        "DATABASE_URL is connected as a superuser or BYPASSRLS role — RLS tests would pass " +
          "trivially and prove nothing. Point DATABASE_URL at the restricted `healthy_nsi_app` " +
          "role (see .env.example / .env.local)."
      );
    }
  });

  async function seedOrgWithOwner(namePrefix: string) {
    const suffix = crypto.randomUUID().slice(0, 8);
    const { organization, owner } = await createOrganizationWithOwner({
      organizationName: `${namePrefix} Org`,
      organizationSlug: `${namePrefix.toLowerCase()}-${suffix}`,
      ownerEmail: `${namePrefix.toLowerCase()}-owner-${suffix}@example.com`,
      ownerFullName: `${namePrefix} Owner`,
    });
    return { org: organization, owner };
  }

  it("blocks reading another organization's clients entirely", async () => {
    const { org: orgA, owner: ownerA } = await seedOrgWithOwner("Alpha");
    const { org: orgB, owner: ownerB } = await seedOrgWithOwner("Beta");

    const clientB = await withOrgContext(orgB.id, ownerB.id, async (tx) => {
      const [c] = await tx
        .insert(clients)
        .values({ organizationId: orgB.id, firstName: "Beta", lastName: "Client" })
        .returning();
      return c;
    });

    // Org A's session should see zero rows for org B's client, not an
    // error — RLS filters rows, it doesn't reject the query.
    const visibleFromOrgA = await withOrgContext(orgA.id, ownerA.id, async (tx) => {
      return tx
        .select()
        .from(clients)
        .where(sql`${clients.id} = ${clientB.id}`);
    });
    expect(visibleFromOrgA).toHaveLength(0);

    // Org B's own session sees it fine.
    const visibleFromOrgB = await withOrgContext(orgB.id, ownerB.id, async (tx) => {
      return tx
        .select()
        .from(clients)
        .where(sql`${clients.id} = ${clientB.id}`);
    });
    expect(visibleFromOrgB).toHaveLength(1);
  });

  it("refuses to insert a row into another organization's tenant, even if the app tries", async () => {
    const { org: orgA, owner: ownerA } = await seedOrgWithOwner("Gamma");
    const { org: orgB } = await seedOrgWithOwner("Delta");

    // Simulates an application bug: session is scoped to org A, but the
    // code mistakenly tries to write a row tagged as org B's. The
    // WITH CHECK clause must reject this at the database layer.
    await expect(
      withOrgContext(orgA.id, ownerA.id, async (tx) => {
        await tx
          .insert(clients)
          .values({ organizationId: orgB.id, firstName: "Should", lastName: "Fail" });
      })
    ).rejects.toThrow();
  });

  it("scopes client visibility by care-team assignment for non-owner roles, not blanket org access", async () => {
    const { org, owner } = await seedOrgWithOwner("Echo");

    const practitioner = await createUser({
      email: `echo-practitioner-${crypto.randomUUID().slice(0, 8)}@example.com`,
      fullName: "Echo Practitioner",
    });

    const { clientAssigned, clientUnassigned } = await withOrgContext(
      org.id,
      owner.id,
      async (tx) => {
        await tx
          .insert(organizationMembers)
          .values({ organizationId: org.id, userId: practitioner.id, role: "practitioner" });

        const [clientAssigned] = await tx
          .insert(clients)
          .values({ organizationId: org.id, firstName: "Assigned", lastName: "Client" })
          .returning();
        const [clientUnassigned] = await tx
          .insert(clients)
          .values({ organizationId: org.id, firstName: "Unassigned", lastName: "Client" })
          .returning();

        await tx.insert(careTeamAssignments).values({
          organizationId: org.id,
          clientId: clientAssigned.id,
          userId: practitioner.id,
          role: "primary",
        });

        return { clientAssigned, clientUnassigned };
      }
    );

    // The owner sees both clients — org owners/admins see everything in
    // their org regardless of individual care-team assignment.
    const ownerView = await withOrgContext(org.id, owner.id, (tx) => tx.select().from(clients));
    expect(ownerView.map((c) => c.id).sort()).toEqual(
      [clientAssigned.id, clientUnassigned.id].sort()
    );

    // The practitioner sees only the client they're assigned to.
    const practitionerView = await withOrgContext(org.id, practitioner.id, (tx) =>
      tx.select().from(clients)
    );
    expect(practitionerView.map((c) => c.id)).toEqual([clientAssigned.id]);
  });

  it("extends care-team scoping to child clinical tables via app_can_access_client", async () => {
    const { org, owner } = await seedOrgWithOwner("Foxtrot");
    const practitioner = await createUser({
      email: `foxtrot-practitioner-${crypto.randomUUID().slice(0, 8)}@example.com`,
      fullName: "Foxtrot Practitioner",
    });

    const client = await withOrgContext(org.id, owner.id, async (tx) => {
      await tx
        .insert(organizationMembers)
        .values({ organizationId: org.id, userId: practitioner.id, role: "practitioner" });
      const [c] = await tx
        .insert(clients)
        .values({ organizationId: org.id, firstName: "Unassigned", lastName: "Client" })
        .returning();
      await tx.insert(dietaryRestrictions).values({
        clientId: c.id,
        restrictionType: "medical_allergy",
        label: "Peanuts",
        severity: "anaphylaxis",
      });
      return c;
    });

    // Not assigned to this client — the allergy record must be invisible,
    // not just the client row. A safety-critical table failing this
    // silently would be a real incident, not a theoretical one.
    const practitionerView = await withOrgContext(org.id, practitioner.id, (tx) =>
      tx
        .select()
        .from(dietaryRestrictions)
        .where(sql`${dietaryRestrictions.clientId} = ${client.id}`)
    );
    expect(practitionerView).toHaveLength(0);

    const ownerView = await withOrgContext(org.id, owner.id, (tx) =>
      tx
        .select()
        .from(dietaryRestrictions)
        .where(sql`${dietaryRestrictions.clientId} = ${client.id}`)
    );
    expect(ownerView).toHaveLength(1);
    expect(ownerView[0].severity).toBe("anaphylaxis");
  });

  it("lets the platform admin context read across organizations, and only that context", async () => {
    const { org, owner } = await seedOrgWithOwner("Golf");
    const client = await withOrgContext(org.id, owner.id, async (tx) => {
      const [c] = await tx
        .insert(clients)
        .values({ organizationId: org.id, firstName: "Golf", lastName: "Client" })
        .returning();
      return c;
    });

    const somePlatformAdmin = await createUser({
      email: `admin-${crypto.randomUUID().slice(0, 8)}@example.com`,
      fullName: "Platform Admin",
    });

    const adminView = await withPlatformAdminContext(somePlatformAdmin.id, (tx) =>
      tx
        .select()
        .from(clients)
        .where(sql`${clients.id} = ${client.id}`)
    );
    expect(adminView).toHaveLength(1);

    // No context at all (simulating a bug: code reaching for the raw
    // client outside any wrapper) must see nothing — fail closed.
    const noContextView = await db
      .select()
      .from(clients)
      .where(sql`${clients.id} = ${client.id}`);
    expect(noContextView).toHaveLength(0);
  });

  it("makes global catalog rows visible to every org, and org-custom rows visible only to their own org", async () => {
    const { org: orgA, owner: ownerA } = await seedOrgWithOwner("Hotel");
    const { org: orgB, owner: ownerB } = await seedOrgWithOwner("India");

    const [source] = await withPlatformAdminContext(ownerA.id, (tx) =>
      tx.insert(foodSources).values({ type: "usda", name: "USDA Test Source" }).returning()
    );

    const globalFood = await withPlatformAdminContext(ownerA.id, (tx) =>
      tx
        .insert(foods)
        .values({ organizationId: null, sourceId: source.id, name: "Global Apple" })
        .returning()
    );

    const orgACustomFood = await withOrgContext(orgA.id, ownerA.id, (tx) =>
      tx
        .insert(foods)
        .values({
          organizationId: orgA.id,
          sourceId: source.id,
          name: "Hotel's Secret Recipe Base",
        })
        .returning()
    );

    // Org B sees the global food, but not org A's custom food.
    const orgBView = await withOrgContext(orgB.id, ownerB.id, (tx) => tx.select().from(foods));
    const orgBIds = orgBView.map((f) => f.id);
    expect(orgBIds).toContain(globalFood[0].id);
    expect(orgBIds).not.toContain(orgACustomFood[0].id);

    // Org A sees both.
    const orgAView = await withOrgContext(orgA.id, ownerA.id, (tx) => tx.select().from(foods));
    const orgAIds = orgAView.map((f) => f.id);
    expect(orgAIds).toContain(globalFood[0].id);
    expect(orgAIds).toContain(orgACustomFood[0].id);
  });

  it("enforces the meal-item exactly-one-of-food-or-recipe check constraint", async () => {
    const { org, owner } = await seedOrgWithOwner("Juliet");
    const client = await withOrgContext(org.id, owner.id, async (tx) => {
      const [c] = await tx
        .insert(clients)
        .values({ organizationId: org.id, firstName: "Juliet", lastName: "Client" })
        .returning();
      return c;
    });

    await withOrgContext(org.id, owner.id, async (tx) => {
      const [program] = await tx
        .insert(programs)
        .values({ organizationId: org.id, clientId: client.id, name: "Test Program" })
        .returning();
      const [day] = await tx
        .insert(programDays)
        .values({ programId: program.id, dayNumber: 1 })
        .returning();
      const [meal] = await tx
        .insert(meals)
        .values({ programDayId: day.id, slot: "breakfast" })
        .returning();

      // Nested in nested transaction (a savepoint): the constraint
      // violation below intentionally aborts *this* statement, and a
      // Postgres transaction can't accept further statements after an
      // error without a rollback point to return to. Without the
      // savepoint, the outer `withOrgContext` transaction itself would
      // fail to commit even though the assertion below passes.
      await expect(
        tx.transaction((savepoint) =>
          savepoint.insert(mealItems).values({
            mealId: meal.id,
            quantity: "1",
            unit: "serving",
            // Neither foodId nor recipeId set — must be rejected.
          })
        )
      ).rejects.toThrow();
    });
  });

  it("never allows updating or deleting an audit_log row, for anyone", async () => {
    const { org, owner } = await seedOrgWithOwner("Kilo");

    const entry = await withOrgContext(org.id, owner.id, (tx) =>
      tx
        .insert(auditLog)
        .values({ organizationId: org.id, actorUserId: owner.id, action: "client.viewed" })
        .returning()
    );

    // With no UPDATE/DELETE policy defined at all, Postgres doesn't
    // reject the statement outright — the row is simply invisible to
    // that command, so it matches zero rows and the statement
    // "succeeds" having changed nothing. That distinction (silently
    // affects 0 rows vs. throws) matters: application code checking
    // only "did this throw" would wrongly conclude a tamper attempt
    // was blocked with an error, when what actually happened is a
    // no-op. The real assertion is that the row is provably unchanged.
    const updateResult = await withOrgContext(org.id, owner.id, (tx) =>
      tx
        .update(auditLog)
        .set({ action: "tampered" })
        .where(sql`${auditLog.id} = ${entry[0].id}`)
        .returning()
    );
    expect(updateResult).toHaveLength(0);

    const deleteResult = await withPlatformAdminContext(owner.id, (tx) =>
      tx
        .delete(auditLog)
        .where(sql`${auditLog.id} = ${entry[0].id}`)
        .returning()
    );
    expect(deleteResult).toHaveLength(0);

    const stillIntact = await withOrgContext(org.id, owner.id, (tx) =>
      tx
        .select()
        .from(auditLog)
        .where(sql`${auditLog.id} = ${entry[0].id}`)
    );
    expect(stillIntact).toHaveLength(1);
    expect(stillIntact[0].action).toBe("client.viewed");
  });

  it("cascades client deletion to its clinical child records", async () => {
    const { org, owner } = await seedOrgWithOwner("Lima");

    const client = await withOrgContext(org.id, owner.id, async (tx) => {
      const [c] = await tx
        .insert(clients)
        .values({ organizationId: org.id, firstName: "Lima", lastName: "Client" })
        .returning();
      await tx.insert(dietaryRestrictions).values({
        clientId: c.id,
        restrictionType: "preference",
        label: "Vegetarian",
      });
      return c;
    });

    await withOrgContext(org.id, owner.id, (tx) =>
      tx.delete(clients).where(sql`${clients.id} = ${client.id}`)
    );

    const remaining = await withPlatformAdminContext(owner.id, (tx) =>
      tx
        .select()
        .from(dietaryRestrictions)
        .where(sql`${dietaryRestrictions.clientId} = ${client.id}`)
    );
    expect(remaining).toHaveLength(0);
  });
});
