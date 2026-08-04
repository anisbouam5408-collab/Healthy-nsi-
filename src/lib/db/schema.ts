/**
 * Drizzle schema root — re-exports every domain module so the
 * database client and drizzle-kit tooling have one import to consume.
 * Domain files live in `./schema/*` and are organized to mirror the
 * Client + Program data model designed before any of this was built:
 * identity & organizations, clients & household/guardian context,
 * clinical data, the unified metrics engine, goals, consultations,
 * tasks/reminders/automation, the food & nutrient database, program
 * building, templates, the AI provenance layer, documents, tags &
 * custom fields, revisions/audit, and consent.
 */
export * from "./schema/enums";
export * from "./schema/organizations";
export * from "./schema/clients";
export * from "./schema/clinical";
export * from "./schema/metrics";
export * from "./schema/goals";
export * from "./schema/consultations";
export * from "./schema/tasks";
export * from "./schema/food";
export * from "./schema/templates";
export * from "./schema/programs";
export * from "./schema/documents";
export * from "./schema/ai";
export * from "./schema/tags";
export * from "./schema/audit";
export * from "./schema/consent";
