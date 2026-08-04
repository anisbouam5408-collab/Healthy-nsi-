import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { clientScopedPolicy, idColumn, timestamps } from "./_helpers";
import { consentTypeEnum } from "./enums";
import { clients } from "./clients";

/**
 * What a client actually agreed to, and exactly which version of the
 * consent text they agreed to — consent language changes over time,
 * and knowing precisely what was agreed to when is a GDPR requirement,
 * not just good practice. This table is where the practitioner-owned
 * data model's "revocable client access" promise (see Module 1's
 * design notes on the data-ownership decision) is actually enforced:
 * revoking `portal_access` here is what the application layer checks
 * before letting a client log in, independent of whether their
 * underlying clinical data still exists.
 */
export const consents = pgTable(
  "consents",
  {
    id: idColumn(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    consentType: consentTypeEnum("consent_type").notNull(),
    /** Version number of the consent text agreed to (application code owns
     *  the actual text per version) — never store only "consented: true"
     *  without knowing what was consented to. */
    textVersion: integer("text_version").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    method: text("method").notNull().default("checkbox"),
    ...timestamps,
  },
  () => [clientScopedPolicy("consents")]
).enableRLS();

export const consentsRelations = relations(consents, ({ one }) => ({
  client: one(clients, { fields: [consents.clientId], references: [clients.id] }),
}));
