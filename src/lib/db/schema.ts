/**
 * Drizzle schema root.
 *
 * Deliberately empty in Module 0 — this file exists so the database
 * client (`./client.ts`) and tooling (`drizzle.config.ts`) have a real
 * target to type against from day one. The full schema (organizations,
 * clients, the unified metrics engine, programs, food/nutrient tables,
 * AI provenance, revisions/audit, consent, etc.) lands in Module 1,
 * following the data model designed and agreed on beforehand.
 */
export {};
