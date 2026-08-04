import { relations } from "drizzle-orm";
import { bigint, foreignKey, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import {
  idColumn,
  orgAndOptionalClientScopedPolicy,
  orgIsolationPolicy,
  softDelete,
  timestamps,
} from "./_helpers";
import {
  attachmentVisibilityEnum,
  generatedDocumentTypeEnum,
  polymorphicEntityTypeEnum,
  textExtractionStatusEnum,
  virusScanStatusEnum,
} from "./enums";
import { clients } from "./clients";
import { organizations, users } from "./organizations";
import { programVersions } from "./programs";

/**
 * Polymorphic file attachments (a client's uploaded lab PDF, a
 * document attached to a consultation note, ...). Per Module 1's
 * design notes on using polymorphism only where genuinely
 * cross-cutting: this table trades away a real foreign key to the
 * specific parent entity for the ability to attach a file to *any* of
 * them uniformly. The mitigation is that RLS here is organization-
 * scoped rather than trying to re-derive per-entity-type access
 * through a large conditional — simpler, and correct, since anyone who
 * can act within an org can be trusted to see that org's attachments;
 * finer-grained visibility (e.g. hiding a client's attachment from a
 * front-desk assistant) is a Phase 2 access-level concern, not a
 * Module 1 one.
 */
export const attachments = pgTable(
  "attachments",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entityType: polymorphicEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    /** Object storage key (Cloudflare R2) — never a public URL; access is
     *  mediated through short-lived signed URLs generated on read. */
    storageKey: text("storage_key").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    visibility: attachmentVisibilityEnum("visibility").notNull().default("practitioner_only"),
    virusScanStatus: virusScanStatusEnum("virus_scan_status").notNull().default("pending"),
    textExtractionStatus: textExtractionStatusEnum("text_extraction_status")
      .notNull()
      .default("not_applicable"),
    ...timestamps,
    ...softDelete,
  },
  () => [orgIsolationPolicy("attachments")]
).enableRLS();

/**
 * Every generated PDF (a sent meal plan, a progress report, an
 * invoice later) is a stored, versioned artifact in its own right —
 * regenerated-on-demand is explicitly not the model here, because
 * "what did we actually hand the client" must stay reproducible
 * exactly, forever, the same principle `programVersions` enforces for
 * the underlying plan data.
 */
export const generatedDocuments = pgTable(
  "generated_documents",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    documentType: generatedDocumentTypeEnum("document_type").notNull(),
    sourceProgramVersionId: uuid("source_program_version_id"),
    storageKey: text("storage_key").notNull(),
    generatedByUserId: uuid("generated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Named explicitly — see the identical note in metrics.ts on why the
    // default auto-generated name here would exceed Postgres's 63-byte
    // identifier limit.
    foreignKey({
      name: "generated_documents_source_version_fk",
      columns: [table.sourceProgramVersionId],
      foreignColumns: [programVersions.id],
    }).onDelete("set null"),
    orgAndOptionalClientScopedPolicy("generated_documents"),
  ]
).enableRLS();

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  uploadedBy: one(users, { fields: [attachments.uploadedByUserId], references: [users.id] }),
}));

export const generatedDocumentsRelations = relations(generatedDocuments, ({ one }) => ({
  client: one(clients, { fields: [generatedDocuments.clientId], references: [clients.id] }),
  sourceProgramVersion: one(programVersions, {
    fields: [generatedDocuments.sourceProgramVersionId],
    references: [programVersions.id],
  }),
  generatedBy: one(users, {
    fields: [generatedDocuments.generatedByUserId],
    references: [users.id],
  }),
}));
