import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  clientScopedPolicy,
  globalOrOrgVisibilityPolicies,
  idColumn,
  softDelete,
  timestamps,
} from "./_helpers";
import { metricCategoryEnum, metricEntrySourceEnum } from "./enums";
import { clients } from "./clients";
import { organizations, users } from "./organizations";

/**
 * The unified metrics engine — the single design decision this module
 * leans on hardest. Body measurements, lab results, vitals, and
 * behavioral/goal-progress tracking are all, structurally, "a number,
 * of a known type, at a point in time, for a client." Rather than four
 * bespoke tables (each needing its own charting and trend-analysis
 * code, and each needing a redesign every time a new specialty wants
 * to track something we didn't anticipate), every one of those is a
 * `metric_definitions` catalog entry plus rows in `metric_entries`.
 * Adding "track resting heart rate" or "VO2 max" for a sports-nutrition
 * practice becomes a config row, not a migration.
 */
export const metricDefinitions = pgTable(
  "metric_definitions",
  {
    id: idColumn(),
    /** Null = system-defined, visible to every organization. Set = an
     *  org's own custom metric, visible only to that org. */
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    /** Stable machine key (e.g. "weight", "waist_circumference", "vitamin_d",
     *  "hba1c") — what code and cross-references key off, independent of
     *  the human-facing, localizable `label`. */
    key: text("key").notNull(),
    label: text("label").notNull(),
    category: metricCategoryEnum("category").notNull(),
    /** Canonical storage unit (e.g. "kg", "cm", "ng/mL") — always SI/metric
     *  canonical; display conversion to the user's preferred unit system
     *  happens at the presentation layer, never in storage. */
    canonicalUnit: text("canonical_unit").notNull(),
    isSystemDefined: boolean("is_system_defined").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    // A global (organization_id IS NULL) key must be unique among global
    // definitions; an org-custom key must be unique within that org.
    // Postgres unique constraints treat NULLs as distinct from each other,
    // so a plain unique(organization_id, key) would *not* stop two global
    // rows from sharing a key — hence two separate indexes.
    uniqueIndex("metric_definitions_global_key_unique")
      .on(table.key)
      .where(sql`organization_id is null`),
    uniqueIndex("metric_definitions_org_key_unique")
      .on(table.organizationId, table.key)
      .where(sql`organization_id is not null`),
    ...globalOrOrgVisibilityPolicies("metric_definitions"),
  ]
).enableRLS();

/**
 * Population-adjusted normal ranges (reference ranges genuinely vary
 * by age, sex, and sometimes lab methodology — a single low/high pair
 * on the definition itself would be clinically wrong). Pure reference
 * data: no client or organization identity lives here, so — unlike
 * every other table in this schema — it deliberately does not carry
 * RLS. That omission is a considered choice, not an oversight.
 */
export const metricReferenceRanges = pgTable(
  "metric_reference_ranges",
  {
    id: idColumn(),
    metricDefinitionId: uuid("metric_definition_id").notNull(),
    /** Flexible population filter, e.g. {"sex":"female","minAge":19,"maxAge":50}.
     *  Application code selects the most specific matching range for a client;
     *  a range with no filters at all acts as the default/fallback. */
    populationFilter: jsonb("population_filter")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    low: numeric("low", { precision: 12, scale: 4 }),
    high: numeric("high", { precision: 12, scale: 4 }),
    ...timestamps,
  },
  (table) => [
    // Named explicitly — the default auto-generated name for this FK
    // exceeds Postgres's 63-byte identifier limit and gets silently
    // truncated, which is a namespacing risk worth avoiding outright
    // rather than trusting truncation to never collide.
    foreignKey({
      name: "metric_reference_ranges_definition_fk",
      columns: [table.metricDefinitionId],
      foreignColumns: [metricDefinitions.id],
    }).onDelete("cascade"),
  ]
);

/**
 * Groups lab values drawn together in one panel/blood draw — optional
 * context a `metric_entries` row can point at when its category is
 * `lab_result`.
 */
export const labPanels = pgTable(
  "lab_panels",
  {
    id: idColumn(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    panelName: text("panel_name").notNull(),
    panelDate: date("panel_date").notNull(),
    orderingProvider: text("ordering_provider"),
    ...timestamps,
  },
  () => [clientScopedPolicy("lab_panels")]
).enableRLS();

export const metricEntries = pgTable(
  "metric_entries",
  {
    id: idColumn(),
    /** Denormalized for query performance (org-wide analytics without a
     *  join through `clients`) — not used for access control. Access
     *  control is entirely governed by `clientScopedPolicy` via `clientId`,
     *  which correctly handles care-team scoping; this column existing or
     *  drifting has no security implication, only a query-convenience one. */
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    metricDefinitionId: uuid("metric_definition_id")
      .notNull()
      .references(() => metricDefinitions.id, { onDelete: "restrict" }),
    labPanelId: uuid("lab_panel_id").references(() => labPanels.id, { onDelete: "set null" }),
    value: numeric("value", { precision: 12, scale: 4 }).notNull(),
    /** Unit *as recorded* — deliberately captured per-entry rather than
     *  always trusting the definition's current canonical unit, the same
     *  snapshot-on-write principle applied everywhere clinical history must
     *  stay accurate to what was actually true at the time. */
    unit: text("unit").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    recordedByUserId: uuid("recorded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    source: metricEntrySourceEnum("source").notNull().default("manual_entry"),
    notes: text("notes"),
    ...timestamps,
    ...softDelete,
  },
  () => [clientScopedPolicy("metric_entries")]
).enableRLS();

export const metricDefinitionsRelations = relations(metricDefinitions, ({ many }) => ({
  referenceRanges: many(metricReferenceRanges),
  entries: many(metricEntries),
}));

export const metricReferenceRangesRelations = relations(metricReferenceRanges, ({ one }) => ({
  definition: one(metricDefinitions, {
    fields: [metricReferenceRanges.metricDefinitionId],
    references: [metricDefinitions.id],
  }),
}));

export const labPanelsRelations = relations(labPanels, ({ one, many }) => ({
  client: one(clients, { fields: [labPanels.clientId], references: [clients.id] }),
  entries: many(metricEntries),
}));

export const metricEntriesRelations = relations(metricEntries, ({ one }) => ({
  client: one(clients, { fields: [metricEntries.clientId], references: [clients.id] }),
  definition: one(metricDefinitions, {
    fields: [metricEntries.metricDefinitionId],
    references: [metricDefinitions.id],
  }),
  labPanel: one(labPanels, { fields: [metricEntries.labPanelId], references: [labPanels.id] }),
  recordedBy: one(users, { fields: [metricEntries.recordedByUserId], references: [users.id] }),
}));
