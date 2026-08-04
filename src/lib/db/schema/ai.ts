import { relations, sql } from "drizzle-orm";
import { jsonb, pgPolicy, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { idColumn, orgAndOptionalClientScopedPolicy, timestamps } from "./_helpers";
import { aiFeedbackRatingEnum, aiRequestTypeEnum, aiReviewStatusEnum } from "./enums";
import { clients } from "./clients";
import { organizations, users } from "./organizations";

/**
 * First-class, auditable record of every AI generation — not a
 * bolted-on feature flag. `inputContext` snapshots exactly what was
 * fed to the model, because "what did the AI see" must be answerable
 * months later, both for debugging and because it's the record that
 * proves what informed a suggestion a practitioner acted on.
 */
export const aiGenerationRequests = pgTable(
  "ai_generation_requests",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    requestType: aiRequestTypeEnum("request_type").notNull(),
    inputContext: jsonb("input_context").$type<Record<string, unknown>>().notNull(),
    modelIdentifier: text("model_identifier").notNull(),
    rawOutput: jsonb("raw_output").$type<Record<string, unknown>>(),
    requestedByUserId: uuid("requested_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [orgAndOptionalClientScopedPolicy("ai_generation_requests")]
).enableRLS();

/**
 * The mandatory human-approval gate: no AI-generated content reaches
 * a client without a row here recording that a person reviewed it —
 * a safety control, a legal record, and (via `approvedOutput` diverging
 * from the request's `rawOutput`) the training signal for the future
 * outcomes-based AI improvements. One review per request — regenerating
 * creates a new request rather than re-reviewing an old one, so the
 * review history stays a clean, linear audit trail.
 */
export const aiGenerationReviews = pgTable(
  "ai_generation_reviews",
  {
    id: idColumn(),
    requestId: uuid("request_id")
      .notNull()
      .unique()
      .references(() => aiGenerationRequests.id, { onDelete: "cascade" }),
    status: aiReviewStatusEnum("status").notNull().default("pending"),
    reviewerUserId: uuid("reviewer_user_id").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    approvedOutput: jsonb("approved_output").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  () => [
    pgPolicy("ai_generation_reviews_via_parent_request", {
      for: "all",
      using: sql`exists (select 1 from ai_generation_requests r where r.id = ai_generation_reviews.request_id)`,
    }),
  ]
).enableRLS();

export const aiFeedback = pgTable(
  "ai_feedback",
  {
    id: idColumn(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => aiGenerationRequests.id, { onDelete: "cascade" }),
    rating: aiFeedbackRatingEnum("rating").notNull(),
    comment: text("comment"),
    givenByUserId: uuid("given_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("ai_feedback_request_user_unique").on(table.requestId, table.givenByUserId),
    pgPolicy("ai_feedback_via_parent_request", {
      for: "all",
      using: sql`exists (select 1 from ai_generation_requests r where r.id = ai_feedback.request_id)`,
    }),
  ]
).enableRLS();

export const aiGenerationRequestsRelations = relations(aiGenerationRequests, ({ one }) => ({
  client: one(clients, { fields: [aiGenerationRequests.clientId], references: [clients.id] }),
  review: one(aiGenerationReviews, {
    fields: [aiGenerationRequests.id],
    references: [aiGenerationReviews.requestId],
  }),
}));

export const aiGenerationReviewsRelations = relations(aiGenerationReviews, ({ one }) => ({
  request: one(aiGenerationRequests, {
    fields: [aiGenerationReviews.requestId],
    references: [aiGenerationRequests.id],
  }),
  reviewer: one(users, { fields: [aiGenerationReviews.reviewerUserId], references: [users.id] }),
}));

export const aiFeedbackRelations = relations(aiFeedback, ({ one }) => ({
  request: one(aiGenerationRequests, {
    fields: [aiFeedback.requestId],
    references: [aiGenerationRequests.id],
  }),
  givenBy: one(users, { fields: [aiFeedback.givenByUserId], references: [users.id] }),
}));
