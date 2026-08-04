import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn, softDelete, timestamps } from "./_helpers";
import {
  careTeamAccessLevelEnum,
  careTeamRoleEnum,
  clientStatusEnum,
  sexAssignedAtBirthEnum,
} from "./enums";
import { organizations, users } from "./organizations";

/**
 * A nutrition case that spans more than one person under the same
 * roof (a family case, a couple working with the same practitioner).
 * Deliberately separate from clinical data: household membership is a
 * grouping/context concept, while each member's actual health record
 * stays individually private — see `guardianRelationships` for who is
 * legally allowed to act on a minor member's behalf.
 */
export const households = pgTable(
  "households",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...timestamps,
  },
  () => [
    pgPolicy("households_org_isolation", {
      for: "all",
      using: sql`organization_id = app_current_org_id() or app_is_platform_admin()`,
      withCheck: sql`organization_id = app_current_org_id()`,
    }),
  ]
).enableRLS();

export const clients = pgTable(
  "clients",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    householdId: uuid("household_id").references(() => households.id, { onDelete: "set null" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    preferredName: text("preferred_name"),
    dateOfBirth: date("date_of_birth"),
    sexAssignedAtBirth: sexAssignedAtBirthEnum("sex_assigned_at_birth"),
    /** Free text, deliberately unconstrained — see Module 1 notes on why
     *  this is never modeled as a fixed enum. */
    genderIdentity: text("gender_identity"),
    email: text("email"),
    phone: text("phone"),
    status: clientStatusEnum("status").notNull().default("lead"),
    /** Free text (self_signup / referred_by_client / referred_by_practitioner /
     *  imported / manual, but intentionally not a hard enum — see Module 1
     *  notes on fields expected to grow organically). */
    acquisitionSource: text("acquisition_source").notNull().default("manual"),
    ...timestamps,
    ...softDelete,
  },
  () => [
    pgPolicy("clients_care_team_scoped_access", {
      for: "all",
      using: sql`
        app_is_platform_admin()
        or (
          organization_id = app_current_org_id()
          and (
            exists (
              select 1 from organization_members om
              where om.organization_id = clients.organization_id
                and om.user_id = app_current_user_id()
                and om.role in ('owner', 'admin')
            )
            or exists (
              select 1 from care_team_assignments cta
              where cta.client_id = clients.id
                and cta.user_id = app_current_user_id()
            )
          )
        )
      `,
      withCheck: sql`organization_id = app_current_org_id()`,
    }),
  ]
).enableRLS();

/**
 * Who is legally able to act on a minor client's behalf. Separate from
 * household membership (a household groups people who share a
 * nutrition context; guardianship is a consent/legal-authority
 * relationship, and a guardian need not be a client themselves).
 */
export const guardianRelationships = pgTable(
  "guardian_relationships",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    minorClientId: uuid("minor_client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    guardianName: text("guardian_name").notNull(),
    guardianEmail: text("guardian_email"),
    guardianPhone: text("guardian_phone"),
    hasConsentAuthority: boolean("has_consent_authority").notNull().default(true),
    ...timestamps,
  },
  () => [
    pgPolicy("guardian_relationships_org_isolation", {
      for: "all",
      using: sql`organization_id = app_current_org_id() or app_is_platform_admin()`,
      withCheck: sql`organization_id = app_current_org_id()`,
    }),
  ]
).enableRLS();

/**
 * The client's own login to the portal — deliberately a separate
 * identity space from `users` (practice staff). Auth mechanics
 * (password/session handling) land in Module 2/8; this table is the
 * stable data anchor for "does this client have portal access, and
 * has it actually been used."
 */
export const clientPortalAccounts = pgTable(
  "client_portal_accounts",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .unique()
      .references(() => clients.id, { onDelete: "cascade" }),
    email: text("email").notNull().unique(),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  () => [
    pgPolicy("client_portal_accounts_org_isolation", {
      for: "all",
      using: sql`organization_id = app_current_org_id() or app_is_platform_admin()`,
      withCheck: sql`organization_id = app_current_org_id()`,
    }),
  ]
).enableRLS();

/**
 * Who on the practice's staff can access a given client, and how.
 * Queried from exactly one row per client in Phase 1 (the solo
 * practitioner) — Phase 2's multi-practitioner teams are additive rows
 * here, not a schema change. See `clientScopedPolicy` in `_helpers.ts`
 * and the `app_can_access_client` SQL function for how this table
 * backs every clinical table's access control.
 */
export const careTeamAssignments = pgTable(
  "care_team_assignments",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: careTeamRoleEnum("role").notNull().default("primary"),
    accessLevel: careTeamAccessLevelEnum("access_level").notNull().default("full"),
    ...timestamps,
  },
  (table) => [
    unique("care_team_assignments_client_user_unique").on(table.clientId, table.userId),
    pgPolicy("care_team_assignments_org_isolation", {
      for: "all",
      using: sql`organization_id = app_current_org_id() or app_is_platform_admin()`,
      withCheck: sql`organization_id = app_current_org_id()`,
    }),
  ]
).enableRLS();

export const householdsRelations = relations(households, ({ many, one }) => ({
  organization: one(organizations, {
    fields: [households.organizationId],
    references: [organizations.id],
  }),
  members: many(clients),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  household: one(households, { fields: [clients.householdId], references: [households.id] }),
  guardianRelationships: many(guardianRelationships),
  portalAccount: one(clientPortalAccounts, {
    fields: [clients.id],
    references: [clientPortalAccounts.clientId],
  }),
  careTeamAssignments: many(careTeamAssignments),
}));

export const guardianRelationshipsRelations = relations(guardianRelationships, ({ one }) => ({
  minorClient: one(clients, {
    fields: [guardianRelationships.minorClientId],
    references: [clients.id],
  }),
}));

export const clientPortalAccountsRelations = relations(clientPortalAccounts, ({ one }) => ({
  client: one(clients, { fields: [clientPortalAccounts.clientId], references: [clients.id] }),
}));

export const careTeamAssignmentsRelations = relations(careTeamAssignments, ({ one }) => ({
  client: one(clients, { fields: [careTeamAssignments.clientId], references: [clients.id] }),
  user: one(users, { fields: [careTeamAssignments.userId], references: [users.id] }),
}));
