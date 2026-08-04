import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgPolicy,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { globalOrOrgVisibilityPolicies, idColumn, softDelete, timestamps } from "./_helpers";
import { foodSourceTypeEnum, nutrientCategoryEnum } from "./enums";
import { organizations, users } from "./organizations";

/**
 * Where a food record came from. Each source is independently
 * versioned (`dataVersion`) so that when an upstream source revises
 * its values, historical meal plans that already used a food don't
 * silently change out from under a client — see the snapshot-on-write
 * principle applied throughout the program builder (Module 6).
 */
export const foodSources = pgTable("food_sources", {
  id: idColumn(),
  type: foodSourceTypeEnum("type").notNull(),
  name: text("name").notNull(),
  dataVersion: text("data_version"),
  ...timestamps,
});

/**
 * One catalog for both the public food database (USDA, Open Food
 * Facts, ANSES-CIQUAL — `organizationId` null) and a practitioner's or
 * org's own custom foods (`organizationId` set) — see
 * `globalOrOrgVisibilityPolicies`. This is a deliberate simplification
 * over treating "custom foods" as a separate table: the rest of the
 * system (recipes, meal items) references exactly one `foods` table
 * and never has to special-case where a food came from.
 */
export const foods = pgTable(
  "foods",
  {
    id: idColumn(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => foodSources.id, { onDelete: "restrict" }),
    externalId: text("external_id"),
    /** Base (source-of-truth) name, typically English or the source's
     *  native language — display name resolution prefers `foodTranslations`
     *  for the viewer's locale and falls back to this. */
    name: text("name").notNull(),
    category: text("category"),
    isBranded: boolean("is_branded").notNull().default(false),
    brandName: text("brand_name"),
    barcode: text("barcode"),
    ...timestamps,
    ...softDelete,
  },
  () => [...globalOrOrgVisibilityPolicies("foods")]
).enableRLS();

/**
 * A food's name in a specific locale — modeled as a real join table
 * rather than a JSONB blob on `foods` so it stays indexable and
 * searchable per locale as the food search feature (Module 5) grows.
 */
export const foodTranslations = pgTable(
  "food_translations",
  {
    id: idColumn(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("food_translations_food_locale_unique").on(table.foodId, table.locale),
    pgPolicy("food_translations_via_parent_food", {
      for: "all",
      using: sql`exists (select 1 from foods f where f.id = food_translations.food_id)`,
    }),
  ]
).enableRLS();

/** Global controlled vocabulary — macro/micronutrients with their
 *  canonical unit and reference intake values. Pure reference data,
 *  same deliberate no-RLS treatment as `metric_reference_ranges`. */
export const nutrients = pgTable("nutrients", {
  id: idColumn(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  category: nutrientCategoryEnum("category").notNull(),
  canonicalUnit: text("canonical_unit").notNull(),
  ...timestamps,
});

export const foodNutrientValues = pgTable(
  "food_nutrient_values",
  {
    id: idColumn(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    nutrientId: uuid("nutrient_id")
      .notNull()
      .references(() => nutrients.id, { onDelete: "restrict" }),
    amountPer100g: numeric("amount_per_100g", { precision: 12, scale: 4 }).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("food_nutrient_values_food_nutrient_unique").on(table.foodId, table.nutrientId),
    pgPolicy("food_nutrient_values_via_parent_food", {
      for: "all",
      using: sql`exists (select 1 from foods f where f.id = food_nutrient_values.food_id)`,
    }),
  ]
).enableRLS();

export const foodUnits = pgTable(
  "food_units",
  {
    id: idColumn(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    gramEquivalent: numeric("gram_equivalent", { precision: 12, scale: 4 }).notNull(),
    ...timestamps,
  },
  () => [
    pgPolicy("food_units_via_parent_food", {
      for: "all",
      using: sql`exists (select 1 from foods f where f.id = food_units.food_id)`,
    }),
  ]
).enableRLS();

export const recipes = pgTable(
  "recipes",
  {
    id: idColumn(),
    /** Null = platform-curated recipe, visible to every organization —
     *  same global-or-org pattern as `foods` and `metric_definitions`. */
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    instructions: text("instructions"),
    servings: integer("servings").notNull().default(1),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
    ...softDelete,
  },
  () => [...globalOrOrgVisibilityPolicies("recipes")]
).enableRLS();

export const recipeIngredients = pgTable(
  "recipe_ingredients",
  {
    id: idColumn(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "restrict" }),
    quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
    unit: text("unit").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    ...timestamps,
  },
  () => [
    pgPolicy("recipe_ingredients_via_parent_recipe", {
      for: "all",
      using: sql`exists (select 1 from recipes r where r.id = recipe_ingredients.recipe_id)`,
    }),
  ]
).enableRLS();

export const foodSourcesRelations = relations(foodSources, ({ many }) => ({
  foods: many(foods),
}));

export const foodsRelations = relations(foods, ({ one, many }) => ({
  source: one(foodSources, { fields: [foods.sourceId], references: [foodSources.id] }),
  translations: many(foodTranslations),
  nutrientValues: many(foodNutrientValues),
  units: many(foodUnits),
}));

export const foodTranslationsRelations = relations(foodTranslations, ({ one }) => ({
  food: one(foods, { fields: [foodTranslations.foodId], references: [foods.id] }),
}));

export const nutrientsRelations = relations(nutrients, ({ many }) => ({
  foodValues: many(foodNutrientValues),
}));

export const foodNutrientValuesRelations = relations(foodNutrientValues, ({ one }) => ({
  food: one(foods, { fields: [foodNutrientValues.foodId], references: [foods.id] }),
  nutrient: one(nutrients, { fields: [foodNutrientValues.nutrientId], references: [nutrients.id] }),
}));

export const foodUnitsRelations = relations(foodUnits, ({ one }) => ({
  food: one(foods, { fields: [foodUnits.foodId], references: [foods.id] }),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  createdBy: one(users, { fields: [recipes.createdByUserId], references: [users.id] }),
  ingredients: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
  food: one(foods, { fields: [recipeIngredients.foodId], references: [foods.id] }),
}));
