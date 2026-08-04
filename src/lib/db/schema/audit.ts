import { relations, sql } from "drizzle-orm";
import { jsonb, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { idColumn, orgIsolationPolicy } from "./_helpers";
import { organizations, users } from "./organizations";

/**
 * The generic snapshot log backing version history across the whole
 * schema — consultation note edits, program versions, consent changes,
 * medical-history edits — one definition instead of a bespoke
 * `*_history` table per entity. `entityType` is deliberately free text
 * here rather than the narrower `polymorphicEntityTypeEnum` used for
 * tags/attachments: far more entity kinds need revision history than
 * need tagging, and this table has no downstream code that depends on
 * the value being from a fixed set (unlike tags/attachments, which
 * drive UI pickers).
 */
export const revisions = pgTable(
  "revisions",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    changedByUserId: uuid("changed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    changeReason: text("change_reason"),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [orgIsolationPolicy("revisions")]
).enableRLS();

/**
 * *Access* log, distinct from `revisions` (which logs data change):
 * who viewed a client record, who exported data, admin impersonation
 * events, failed access attempts. Append-only by construction — there
 * is deliberately no update or delete policy defined for this table at
 * all, which means Postgres denies those operations to every role,
 * including platform admins, by default. An audit trail that can be
 * edited by the people it might need to catch is not an audit trail.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: idColumn(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("audit_log_select", {
      for: "select",
      using: sql`organization_id = app_current_org_id() or app_is_platform_admin()`,
    }),
    pgPolicy("audit_log_insert", {
      for: "insert",
      withCheck: sql`organization_id = app_current_org_id() or app_is_platform_admin()`,
    }),
    // No update or delete policy, anywhere, for anyone — see the note above.
  ]
).enableRLS();

export const revisionsRelations = relations(revisions, ({ one }) => ({
  changedBy: one(users, { fields: [revisions.changedByUserId], references: [users.id] }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(users, { fields: [auditLog.actorUserId], references: [users.id] }),
}));
