import { relations } from "drizzle-orm";
import { boolean, date, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import {
  clientScopedPolicy,
  idColumn,
  orgAndOptionalClientScopedPolicy,
  orgIsolationPolicy,
  softDelete,
  timestamps,
} from "./_helpers";
import {
  automationActionTypeEnum,
  polymorphicEntityTypeEnum,
  reminderChannelEnum,
  taskStatusEnum,
} from "./enums";
import { clients } from "./clients";
import { organizations, users } from "./organizations";

/**
 * Practitioner-internal to-dos. `clientId` is nullable — a task can be
 * general practice admin, not tied to any one client — so this table
 * cannot use the strict `clientScopedPolicy` helper (which would make
 * client-less rows invisible to everyone). Its policy is a superset:
 * org-scoped, and *additionally* care-team-scoped whenever a client is
 * attached.
 */
export const tasks = pgTable(
  "tasks",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    assigneeUserId: uuid("assignee_user_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: date("due_date"),
    status: taskStatusEnum("status").notNull().default("open"),
    /** Optional polymorphic link (e.g. "follow up on this program"). Not a
     *  real foreign key — see Module 1's notes on using polymorphism only
     *  where genuinely cross-cutting, with the integrity trade-off that
     *  implies, mitigated at the application layer. */
    relatedEntityType: polymorphicEntityTypeEnum("related_entity_type"),
    relatedEntityId: uuid("related_entity_id"),
    ...timestamps,
    ...softDelete,
  },
  () => [orgAndOptionalClientScopedPolicy("tasks")]
).enableRLS();

/**
 * Client-facing scheduled nudges — always tied to a client, so this
 * one *does* use the standard client-scoped policy.
 */
export const reminders = pgTable(
  "reminders",
  {
    id: idColumn(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    channel: reminderChannelEnum("channel").notNull().default("push"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    /** Simple recurrence description (e.g. "weekly", "daily") — deliberately
     *  not a full RFC 5545 RRULE parser for v1; the column is free text so
     *  that upgrade is additive, not a migration. */
    recurrenceRule: text("recurrence_rule"),
    sourceAutomationRuleId: uuid("source_automation_rule_id").references(() => automationRules.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  () => [clientScopedPolicy("reminders")]
).enableRLS();

/**
 * The trigger → condition → action engine backing both reminders and
 * task auto-creation (e.g. "no progress photo in 14 days → remind the
 * client and create a follow-up task for the practitioner") — one
 * configurable mechanism instead of hardcoded logic per notification
 * type, and the same mechanism the future churn-risk analytics feature
 * builds on.
 */
export const automationRules = pgTable(
  "automation_rules",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    triggerType: text("trigger_type").notNull(),
    conditionConfig: jsonb("condition_config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    actionType: automationActionTypeEnum("action_type").notNull(),
    actionConfig: jsonb("action_config").$type<Record<string, unknown>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  () => [orgIsolationPolicy("automation_rules")]
).enableRLS();

export const tasksRelations = relations(tasks, ({ one }) => ({
  client: one(clients, { fields: [tasks.clientId], references: [clients.id] }),
  assignee: one(users, { fields: [tasks.assigneeUserId], references: [users.id] }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  client: one(clients, { fields: [reminders.clientId], references: [clients.id] }),
  sourceAutomationRule: one(automationRules, {
    fields: [reminders.sourceAutomationRuleId],
    references: [automationRules.id],
  }),
}));

export const automationRulesRelations = relations(automationRules, ({ many }) => ({
  reminders: many(reminders),
}));
