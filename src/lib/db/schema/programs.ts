import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  jsonb,
  numeric,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn, orgAndOptionalClientScopedPolicy, softDelete, timestamps } from "./_helpers";
import { programDurationModelEnum, programStatusEnum, provenanceOriginEnum } from "./enums";
import { clients } from "./clients";
import { organizations, users } from "./organizations";
import { foods, recipes } from "./food";
import { programTemplates } from "./templates";
import { goals } from "./goals";

/**
 * The container for a nutrition plan. `clientId` is nullable — a
 * practitioner may prototype a program before assigning it, mirroring
 * `tasks`' hybrid org/client RLS scoping rather than the strict
 * `clientScopedPolicy`. Group/cohort programs (one plan, many clients)
 * are a deliberately deferred feature: modeling that properly means a
 * many-to-many client relationship instead of this single `clientId`,
 * and that's a real design decision earning its own pass when the
 * feature is actually scoped, not a field bolted on speculatively now.
 */
export const programs = pgTable(
  "programs",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: programStatusEnum("status").notNull().default("draft"),
    durationModel: programDurationModelEnum("duration_model").notNull().default("fixed_calendar"),
    startDate: date("start_date"),
    createdFromTemplateId: uuid("created_from_template_id").references(() => programTemplates.id, {
      onDelete: "set null",
    }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
    ...softDelete,
  },
  () => [orgAndOptionalClientScopedPolicy("programs")]
).enableRLS();

/** Many-to-many: a program can support more than one goal, and a goal
 *  can be pursued across more than one program over time. */
export const programGoals = pgTable(
  "program_goals",
  {
    id: idColumn(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    unique("program_goals_program_goal_unique").on(table.programId, table.goalId),
    pgPolicy("program_goals_via_parent_program", {
      for: "all",
      using: sql`exists (select 1 from programs p where p.id = program_goals.program_id)`,
    }),
  ]
).enableRLS();

/**
 * Every time a program is sent/shared to a client, a full snapshot
 * lands here — nutrient values frozen as they were at that moment
 * (see the snapshot-on-write principle in Module 1's design notes).
 * No `updatedAt`/soft-delete: a version is immutable by construction,
 * and the schema deliberately gives it no column that would invite
 * editing one after the fact.
 */
export const programVersions = pgTable(
  "program_versions",
  {
    id: idColumn(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    /** Full frozen day/meal/item/nutrient tree as it was sent — the
     *  structural counterpart to the live, editable `programDays` /
     *  `meals` / `mealItems` rows below. */
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("program_versions_program_version_unique").on(table.programId, table.versionNumber),
    pgPolicy("program_versions_via_parent_program", {
      for: "all",
      using: sql`exists (select 1 from programs p where p.id = program_versions.program_id)`,
    }),
  ]
).enableRLS();

export const programDays = pgTable(
  "program_days",
  {
    id: idColumn(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    label: text("label"),
    ...timestamps,
  },
  (table) => [
    unique("program_days_program_day_unique").on(table.programId, table.dayNumber),
    pgPolicy("program_days_via_parent_program", {
      for: "all",
      using: sql`exists (select 1 from programs p where p.id = program_days.program_id)`,
    }),
  ]
).enableRLS();

export const meals = pgTable(
  "meals",
  {
    id: idColumn(),
    programDayId: uuid("program_day_id")
      .notNull()
      .references(() => programDays.id, { onDelete: "cascade" }),
    /** e.g. "breakfast" / "lunch" / "dinner" / "snack", or a practitioner's
     *  own custom slot name — free text by design, see Module 1's notes on
     *  fields expected to grow beyond a fixed set. */
    slot: text("slot").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    targetTime: text("target_time"),
    ...timestamps,
  },
  () => [
    pgPolicy("meals_via_parent_program", {
      for: "all",
      using: sql`exists (
        select 1 from program_days pd
        join programs p on p.id = pd.program_id
        where pd.id = meals.program_day_id
      )`,
    }),
  ]
).enableRLS();

/**
 * A meal item references exactly one of `foodId` / `recipeId` — never
 * both, never neither, enforced by a database check constraint rather
 * than trusted to application code. Items sharing a `substitutionGroupId`
 * within the same meal are interchangeable options ("choose one of
 * these three breakfasts") — a real, differentiating builder feature,
 * not an afterthought bolted onto a rigid one-item-per-slot model.
 */
export const mealItems = pgTable(
  "meal_items",
  {
    id: idColumn(),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    foodId: uuid("food_id").references(() => foods.id, { onDelete: "restrict" }),
    recipeId: uuid("recipe_id").references(() => recipes.id, { onDelete: "restrict" }),
    quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
    unit: text("unit").notNull(),
    substitutionGroupId: uuid("substitution_group_id"),
    orderIndex: integer("order_index").notNull().default(0),
    origin: provenanceOriginEnum("origin").notNull().default("human"),
    ...timestamps,
  },
  () => [
    check(
      "meal_items_exactly_one_food_or_recipe",
      sql`(food_id is not null and recipe_id is null) or (food_id is null and recipe_id is not null)`
    ),
    pgPolicy("meal_items_via_parent_program", {
      for: "all",
      using: sql`exists (
        select 1 from meals m
        join program_days pd on pd.id = m.program_day_id
        join programs p on p.id = pd.program_id
        where m.id = meal_items.meal_id
      )`,
    }),
  ]
).enableRLS();

export const programsRelations = relations(programs, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [programs.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, { fields: [programs.clientId], references: [clients.id] }),
  createdFromTemplate: one(programTemplates, {
    fields: [programs.createdFromTemplateId],
    references: [programTemplates.id],
  }),
  days: many(programDays),
  versions: many(programVersions),
  programGoals: many(programGoals),
}));

export const programGoalsRelations = relations(programGoals, ({ one }) => ({
  program: one(programs, { fields: [programGoals.programId], references: [programs.id] }),
  goal: one(goals, { fields: [programGoals.goalId], references: [goals.id] }),
}));

export const programVersionsRelations = relations(programVersions, ({ one }) => ({
  program: one(programs, { fields: [programVersions.programId], references: [programs.id] }),
}));

export const programDaysRelations = relations(programDays, ({ one, many }) => ({
  program: one(programs, { fields: [programDays.programId], references: [programs.id] }),
  meals: many(meals),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  programDay: one(programDays, { fields: [meals.programDayId], references: [programDays.id] }),
  items: many(mealItems),
}));

export const mealItemsRelations = relations(mealItems, ({ one }) => ({
  meal: one(meals, { fields: [mealItems.mealId], references: [meals.id] }),
  food: one(foods, { fields: [mealItems.foodId], references: [foods.id] }),
  recipe: one(recipes, { fields: [mealItems.recipeId], references: [recipes.id] }),
}));
