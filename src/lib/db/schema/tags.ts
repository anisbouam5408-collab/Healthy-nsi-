import { relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn, orgIsolationPolicy, timestamps } from "./_helpers";
import { customFieldTypeEnum, polymorphicEntityTypeEnum } from "./enums";
import { organizations } from "./organizations";

/** One tagging system, applied uniformly to clients, programs, and
 *  recipes alike via the shared `polymorphicEntityTypeEnum` — not a
 *  separate join table per taggable entity. */
export const tags = pgTable(
  "tags",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    category: text("category"),
    ...timestamps,
  },
  (table) => [
    unique("tags_org_name_unique").on(table.organizationId, table.name),
    orgIsolationPolicy("tags"),
  ]
).enableRLS();

export const taggings = pgTable(
  "taggings",
  {
    id: idColumn(),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    entityType: polymorphicEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("taggings_tag_entity_unique").on(table.tagId, table.entityType, table.entityId),
    pgPolicy("taggings_via_parent_tag", {
      for: "all",
      using: sql`exists (select 1 from tags t where t.id = taggings.tag_id)`,
    }),
  ]
).enableRLS();

/**
 * Lets a specialty practice track fields we didn't anticipate (a
 * sports-nutrition practice's "VO2 max target," a prenatal specialist's
 * "trimester") without a schema migration — this mechanism, plus the
 * unified metrics engine, is most of what makes the platform credibly
 * extensible across specialties for years rather than needing a
 * redesign every time a new practitioner type shows up.
 */
export const customFieldDefinitions = pgTable(
  "custom_field_definitions",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entityType: polymorphicEntityTypeEnum("entity_type").notNull(),
    fieldKey: text("field_key").notNull(),
    label: text("label").notNull(),
    fieldType: customFieldTypeEnum("field_type").notNull(),
    /** Option labels for select/multiselect field types. */
    options: jsonb("options").$type<string[]>(),
    isRequired: boolean("is_required").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    unique("custom_field_definitions_org_entity_key_unique").on(
      table.organizationId,
      table.entityType,
      table.fieldKey
    ),
    orgIsolationPolicy("custom_field_definitions"),
  ]
).enableRLS();

export const customFieldValues = pgTable(
  "custom_field_values",
  {
    id: idColumn(),
    definitionId: uuid("definition_id").notNull(),
    entityId: uuid("entity_id").notNull(),
    value: jsonb("value").$type<unknown>(),
    ...timestamps,
  },
  (table) => [
    unique("custom_field_values_definition_entity_unique").on(table.definitionId, table.entityId),
    // Named explicitly — see the identical note in metrics.ts on why the
    // default auto-generated name here would exceed Postgres's 63-byte
    // identifier limit.
    foreignKey({
      name: "custom_field_values_definition_fk",
      columns: [table.definitionId],
      foreignColumns: [customFieldDefinitions.id],
    }).onDelete("cascade"),
    pgPolicy("custom_field_values_via_parent_definition", {
      for: "all",
      using: sql`exists (select 1 from custom_field_definitions d where d.id = custom_field_values.definition_id)`,
    }),
  ]
).enableRLS();

export const tagsRelations = relations(tags, ({ many }) => ({
  taggings: many(taggings),
}));

export const taggingsRelations = relations(taggings, ({ one }) => ({
  tag: one(tags, { fields: [taggings.tagId], references: [tags.id] }),
}));

export const customFieldDefinitionsRelations = relations(customFieldDefinitions, ({ many }) => ({
  values: many(customFieldValues),
}));

export const customFieldValuesRelations = relations(customFieldValues, ({ one }) => ({
  definition: one(customFieldDefinitions, {
    fields: [customFieldValues.definitionId],
    references: [customFieldDefinitions.id],
  }),
}));
