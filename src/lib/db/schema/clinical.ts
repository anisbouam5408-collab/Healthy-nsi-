import { relations } from "drizzle-orm";
import { boolean, date, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { clientScopedPolicy, idColumn, timestamps } from "./_helpers";
import {
  dietaryRestrictionTypeEnum,
  medicalConditionStatusEnum,
  restrictionSeverityEnum,
  verificationStatusEnum,
} from "./enums";
import { clients } from "./clients";

export const medicalConditions = pgTable(
  "medical_conditions",
  {
    id: idColumn(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Optional ICD-10 code — present for future clinical interoperability
     *  (referrals, insurance billing modules), never required at entry. */
    icd10Code: text("icd10_code"),
    status: medicalConditionStatusEnum("status").notNull().default("active"),
    diagnosedDate: date("diagnosed_date"),
    notes: text("notes"),
    ...timestamps,
  },
  () => [clientScopedPolicy("medical_conditions")]
).enableRLS();

/**
 * Exists specifically to power drug–nutrient interaction flagging — a
 * named safety feature, not incidental data collection. `activeOnly`
 * queries (the common case) should filter `isActive = true`.
 */
export const medications = pgTable(
  "medications",
  {
    id: idColumn(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dosage: text("dosage"),
    frequency: text("frequency"),
    prescribingProvider: text("prescribing_provider"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  () => [clientScopedPolicy("medications")]
).enableRLS();

export const familyMedicalHistory = pgTable(
  "family_medical_history",
  {
    id: idColumn(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    relation: text("relation").notNull(),
    condition: text("condition").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  () => [clientScopedPolicy("family_medical_history")]
).enableRLS();

export const surgeriesProcedures = pgTable(
  "surgeries_procedures",
  {
    id: idColumn(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    date: date("date"),
    notes: text("notes"),
    ...timestamps,
  },
  () => [clientScopedPolicy("surgeries_procedures")]
).enableRLS();

/**
 * The safety backbone of the whole program builder: allergy, medical
 * intolerance, doctor-prescribed therapeutic diet, and personal/
 * religious/ethical preference are different *kinds* of restriction
 * with different safety weight, but every one of them must be checked
 * against every meal item added to a plan. Kept as its own first-class
 * table (not folded into freeform medical history) specifically so
 * that check can be automated — see the Program Builder module's
 * design notes for how this table is consulted.
 */
export const dietaryRestrictions = pgTable(
  "dietary_restrictions",
  {
    id: idColumn(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    restrictionType: dietaryRestrictionTypeEnum("restriction_type").notNull(),
    /** Free text label of the allergen/ingredient/diet — linked to the food
     *  taxonomy where possible at the application layer once Module 5's
     *  food database exists; free text remains the fallback so an entry is
     *  never blocked by an incomplete match against the catalog. */
    label: text("label").notNull(),
    severity: restrictionSeverityEnum("severity").notNull().default("moderate"),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("self_reported"),
    reactionNotes: text("reaction_notes"),
    identifiedDate: date("identified_date"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  () => [clientScopedPolicy("dietary_restrictions")]
).enableRLS();

export const medicalConditionsRelations = relations(medicalConditions, ({ one }) => ({
  client: one(clients, { fields: [medicalConditions.clientId], references: [clients.id] }),
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  client: one(clients, { fields: [medications.clientId], references: [clients.id] }),
}));

export const familyMedicalHistoryRelations = relations(familyMedicalHistory, ({ one }) => ({
  client: one(clients, { fields: [familyMedicalHistory.clientId], references: [clients.id] }),
}));

export const surgeriesProceduresRelations = relations(surgeriesProcedures, ({ one }) => ({
  client: one(clients, { fields: [surgeriesProcedures.clientId], references: [clients.id] }),
}));

export const dietaryRestrictionsRelations = relations(dietaryRestrictions, ({ one }) => ({
  client: one(clients, { fields: [dietaryRestrictions.clientId], references: [clients.id] }),
}));
