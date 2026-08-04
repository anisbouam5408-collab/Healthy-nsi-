import { relations, sql } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn, selfOrgIsolationPolicy, softDelete, timestamps } from "./_helpers";
import { credentialVerificationStatusEnum, orgMemberRoleEnum, unitSystemEnum } from "./enums";

/**
 * Every account — solo practitioner or eventual training center — has
 * exactly one organization, auto-provisioned at signup (Module 2). This
 * is what lets multi-seat orgs, team collaboration, and white-labeling
 * land later as feature work on top of an unchanged data model, rather
 * than a retrofit: there is no "solo mode" special case anywhere else
 * in the schema, only organizations with exactly one member.
 */
export const organizations = pgTable(
  "organizations",
  {
    id: idColumn(),
    name: text("name").notNull(),
    /** URL-safe handle, reserved for the future public directory/booking pages. */
    slug: text("slug").notNull().unique(),
    /** Data-residency hint (e.g. "eu", "us") — unused operationally until we
     *  actually pin deployments by region, but present now so that migration
     *  isn't a schema change later, only a config one. */
    region: text("region").notNull().default("eu"),
    localeDefault: text("locale_default").notNull().default("en"),
    unitSystemDefault: unitSystemEnum("unit_system_default").notNull().default("metric"),
    /** White-label theming tokens (logo, brand colors). Null until that tier
     *  ships — the column exists now so theming is additive, not a migration. */
    brandingTokens: jsonb("branding_tokens").$type<Record<string, string>>(),
    ...timestamps,
    ...softDelete,
  },
  () => [
    selfOrgIsolationPolicy("organizations"),
    // A brand-new organization has no `app.current_org_id` context yet
    // (that's set *from* this row, once it exists) — so row creation is
    // deliberately left to application-layer gating (Module 2's signup
    // flow), not RLS. RLS's job here is isolating orgs from each other
    // once they exist, not deciding who is allowed to create one.
    pgPolicy("organizations_insert_self", {
      for: "insert",
      withCheck: sql`true`,
    }),
  ]
).enableRLS();

/**
 * Account identity, deliberately separate from professional identity
 * (`practitionerProfiles`) and from auth mechanics (credentials,
 * sessions — Module 2). A user can belong to more than one
 * organization over their career; this table is the stable anchor
 * every other table's `createdBy`/`userId` foreign keys point to.
 */
export const users = pgTable(
  "users",
  {
    id: idColumn(),
    email: text("email").notNull().unique(),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    localePreference: text("locale_preference").notNull().default("en"),
    unitSystemPreference: unitSystemEnum("unit_system_preference").notNull().default("metric"),
    /** IANA timezone name (e.g. "Europe/Paris") — every timestamp shown to
     *  this user is rendered against it; storage stays UTC everywhere. */
    timezone: text("timezone").notNull().default("UTC"),
    ...timestamps,
    ...softDelete,
  },
  () => [
    pgPolicy("users_visible_to_self_or_org_mates", {
      for: "select",
      using: sql`
        id = app_current_user_id()
        or app_is_platform_admin()
        or exists (
          select 1 from organization_members me
          join organization_members them on them.organization_id = me.organization_id
          where me.user_id = app_current_user_id()
            and them.user_id = users.id
        )
      `,
    }),
    pgPolicy("users_modify_self_only", {
      for: "insert",
      withCheck: sql`true`,
    }),
    pgPolicy("users_update_self_only", {
      for: "update",
      using: sql`id = app_current_user_id() or app_is_platform_admin()`,
    }),
  ]
).enableRLS();

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: orgMemberRoleEnum("role").notNull(),
    invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("organization_members_org_user_unique").on(table.organizationId, table.userId),
    pgPolicy("organization_members_org_isolation", {
      for: "all",
      using: sql`organization_id = app_current_org_id() or user_id = app_current_user_id() or app_is_platform_admin()`,
      withCheck: sql`organization_id = app_current_org_id()`,
    }),
  ]
).enableRLS();

/**
 * Professional identity — bio, specialties, the future public/verified
 * directory profile. Split from `users` because a user's account
 * exists the moment they sign up, but their public professional
 * presence is an opt-in, separately-managed thing (and, per the
 * product's growth-loop bet, sometimes visible to the public internet
 * — the RLS policy below reflects that explicitly, rather than that
 * being a gap discovered later).
 */
export const practitionerProfiles = pgTable(
  "practitioner_profiles",
  {
    id: idColumn(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    bio: text("bio"),
    specialties: text("specialties")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    publicSlug: text("public_slug").unique(),
    isPubliclyListed: boolean("is_publicly_listed").notNull().default(false),
    ...timestamps,
  },
  () => [
    pgPolicy("practitioner_profiles_visibility", {
      for: "select",
      using: sql`
        is_publicly_listed = true
        or user_id = app_current_user_id()
        or app_is_platform_admin()
      `,
    }),
    pgPolicy("practitioner_profiles_modify_self_only", {
      for: "insert",
      withCheck: sql`user_id = app_current_user_id()`,
    }),
    pgPolicy("practitioner_profiles_update_self_only", {
      for: "update",
      using: sql`user_id = app_current_user_id() or app_is_platform_admin()`,
    }),
  ]
).enableRLS();

/**
 * Backs the verified-professional trust badge and directory — a
 * deliberately operationally-heavy feature (see the product strategy
 * discussion) that only makes sense if verification records are a
 * first-class, auditable data structure from the start.
 */
export const credentialVerifications = pgTable(
  "credential_verifications",
  {
    id: idColumn(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialType: text("credential_type").notNull(),
    issuingBody: text("issuing_body"),
    licenseNumber: text("license_number"),
    status: credentialVerificationStatusEnum("status").notNull().default("pending"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedByUserId: uuid("verified_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    ...timestamps,
  },
  () => [
    pgPolicy("credential_verifications_visibility", {
      for: "select",
      using: sql`user_id = app_current_user_id() or app_is_platform_admin()`,
    }),
    pgPolicy("credential_verifications_self_submit", {
      for: "insert",
      withCheck: sql`user_id = app_current_user_id()`,
    }),
    pgPolicy("credential_verifications_admin_manage", {
      for: "all",
      using: sql`app_is_platform_admin()`,
    }),
  ]
).enableRLS();

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  memberships: many(organizationMembers),
  practitionerProfile: one(practitionerProfiles, {
    fields: [users.id],
    references: [practitionerProfiles.userId],
  }),
  credentialVerifications: many(credentialVerifications),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, { fields: [organizationMembers.userId], references: [users.id] }),
}));

export const practitionerProfilesRelations = relations(practitionerProfiles, ({ one }) => ({
  user: one(users, { fields: [practitionerProfiles.userId], references: [users.id] }),
}));

export const credentialVerificationsRelations = relations(credentialVerifications, ({ one }) => ({
  user: one(users, { fields: [credentialVerifications.userId], references: [users.id] }),
  verifiedBy: one(users, {
    fields: [credentialVerifications.verifiedByUserId],
    references: [users.id],
  }),
}));
