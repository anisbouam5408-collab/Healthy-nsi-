import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { globalOrOrgVisibilityPolicies, idColumn, softDelete, timestamps } from "./_helpers";
import { programDurationModelEnum, templateProvenanceEnum } from "./enums";
import { organizations, users } from "./organizations";

/**
 * Templates are blueprints, not live plans — deliberately modeled as
 * structured JSON rather than duplicating the full relational
 * `programDays` / `meals` / `mealItems` shape a second time. A
 * template only becomes fully relational (with real foreign keys,
 * nutrient computation, and version history) the moment it's
 * instantiated into an actual `programs` row; until then it's inert
 * data with no need for that machinery. `provenance` is what turns
 * this into a real ecosystem feature over time: `personal` /
 * `org_shared` (Phase 2 team libraries) / `platform_curated` /
 * `marketplace` (future paid specialty packs) all live in the same
 * table, distinguished only by this field and `organizationId`.
 */
export const programTemplates = pgTable(
  "program_templates",
  {
    id: idColumn(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description"),
    provenance: templateProvenanceEnum("provenance").notNull().default("personal"),
    durationModel: programDurationModelEnum("duration_model").notNull().default("fixed_calendar"),
    /** The day/meal/item blueprint — same shape a program snapshot takes,
     *  minus anything that only makes sense for a live, client-attached
     *  program (no nutrient totals computed here; those depend on the
     *  live food database at instantiation time). */
    structure: jsonb("structure").$type<Record<string, unknown>>().notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
    ...softDelete,
  },
  () => [...globalOrOrgVisibilityPolicies("program_templates")]
).enableRLS();

export const mealTemplates = pgTable(
  "meal_templates",
  {
    id: idColumn(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    slot: text("slot"),
    provenance: templateProvenanceEnum("provenance").notNull().default("personal"),
    structure: jsonb("structure").$type<Record<string, unknown>>().notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
    ...softDelete,
  },
  () => [...globalOrOrgVisibilityPolicies("meal_templates")]
).enableRLS();

export const programTemplatesRelations = relations(programTemplates, ({ one }) => ({
  createdBy: one(users, { fields: [programTemplates.createdByUserId], references: [users.id] }),
}));

export const mealTemplatesRelations = relations(mealTemplates, ({ one }) => ({
  createdBy: one(users, { fields: [mealTemplates.createdByUserId], references: [users.id] }),
}));
