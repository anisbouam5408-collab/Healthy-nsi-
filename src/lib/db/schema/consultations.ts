import { relations, sql } from "drizzle-orm";
import { integer, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { clientScopedPolicy, idColumn, softDelete, timestamps } from "./_helpers";
import {
  appointmentLocationTypeEnum,
  appointmentStatusEnum,
  appointmentTypeEnum,
  noteBlockTypeEnum,
  noteStatusEnum,
} from "./enums";
import { clients } from "./clients";
import { organizations, users } from "./organizations";

export const appointments = pgTable(
  "appointments",
  {
    id: idColumn(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    practitionerUserId: uuid("practitioner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    type: appointmentTypeEnum("type").notNull().default("follow_up"),
    status: appointmentStatusEnum("status").notNull().default("scheduled"),
    locationType: appointmentLocationTypeEnum("location_type").notNull().default("in_person"),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true }).notNull(),
    scheduledEnd: timestamp("scheduled_end", { withTimezone: true }).notNull(),
    notes: text("notes"),
    ...timestamps,
    ...softDelete,
  },
  () => [clientScopedPolicy("appointments")]
).enableRLS();

/**
 * The consultation record itself. Modeled as a header row plus
 * ordered `note_blocks` (SOAP structure — the actual documentation
 * standard dietitians are trained in — or freeform) rather than one
 * large text field, so notes are searchable and AI-summarizable
 * field-by-field. Once `finalizedAt` is set the note is immutable at
 * the application layer: further changes must be appended as new
 * `addendum` blocks, never edits to existing ones — the standard
 * clinical-documentation practice, and the reason a finalized note is
 * a legally defensible record rather than a mutable scratchpad.
 */
export const consultationNotes = pgTable(
  "consultation_notes",
  {
    id: idColumn(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: noteStatusEnum("status").notNull().default("draft"),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    ...timestamps,
    ...softDelete,
  },
  () => [clientScopedPolicy("consultation_notes")]
).enableRLS();

// note_blocks has no direct client_id, so it can't use the standard
// clientScopedPolicy helper — access is derived through its parent
// consultation_notes row instead.
export const noteBlocks = pgTable(
  "note_blocks",
  {
    id: idColumn(),
    consultationNoteId: uuid("consultation_note_id")
      .notNull()
      .references(() => consultationNotes.id, { onDelete: "cascade" }),
    blockType: noteBlockTypeEnum("block_type").notNull(),
    content: text("content").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    ...timestamps,
  },
  () => [
    pgPolicy("note_blocks_via_parent_note", {
      for: "all",
      using: sql`
        app_is_platform_admin()
        or exists (
          select 1 from consultation_notes cn
          where cn.id = note_blocks.consultation_note_id
            and app_can_access_client(cn.client_id)
        )
      `,
      withCheck: sql`
        exists (
          select 1 from consultation_notes cn
          where cn.id = note_blocks.consultation_note_id
            and app_can_access_client(cn.client_id)
        )
      `,
    }),
  ]
).enableRLS();

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  client: one(clients, { fields: [appointments.clientId], references: [clients.id] }),
  practitioner: one(users, { fields: [appointments.practitionerUserId], references: [users.id] }),
  consultationNotes: many(consultationNotes),
}));

export const consultationNotesRelations = relations(consultationNotes, ({ one, many }) => ({
  client: one(clients, { fields: [consultationNotes.clientId], references: [clients.id] }),
  appointment: one(appointments, {
    fields: [consultationNotes.appointmentId],
    references: [appointments.id],
  }),
  author: one(users, { fields: [consultationNotes.authorUserId], references: [users.id] }),
  blocks: many(noteBlocks),
}));

export const noteBlocksRelations = relations(noteBlocks, ({ one }) => ({
  consultationNote: one(consultationNotes, {
    fields: [noteBlocks.consultationNoteId],
    references: [consultationNotes.id],
  }),
}));
