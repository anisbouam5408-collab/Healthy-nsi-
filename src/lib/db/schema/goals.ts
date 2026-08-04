import { relations } from "drizzle-orm";
import { date, numeric, pgTable, uuid } from "drizzle-orm/pg-core";

import { clientScopedPolicy, idColumn, timestamps } from "./_helpers";
import { goalStatusEnum, goalTypeEnum } from "./enums";
import { clients } from "./clients";
import { metricDefinitions } from "./metrics";

/**
 * A goal is "reach `targetValue` on `targetMetricDefinition` by
 * `targetDate`" — deliberately reusing the same metric catalog as
 * measurements and lab results rather than a parallel goal-specific
 * vocabulary. Progress is *computed*, not stored: derived live from
 * `metric_entries` against the target, at query time. Changing a
 * target (70kg → 68kg) is itself a meaningful coaching event, so goal
 * edits go through the generic `revisions` log (see `audit.ts`) rather
 * than silently overwriting the row.
 */
export const goals = pgTable(
  "goals",
  {
    id: idColumn(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    goalType: goalTypeEnum("goal_type").notNull(),
    targetMetricDefinitionId: uuid("target_metric_definition_id")
      .notNull()
      .references(() => metricDefinitions.id, { onDelete: "restrict" }),
    targetValue: numeric("target_value", { precision: 12, scale: 4 }).notNull(),
    startDate: date("start_date").notNull(),
    targetDate: date("target_date"),
    status: goalStatusEnum("status").notNull().default("active"),
    ...timestamps,
  },
  () => [clientScopedPolicy("goals")]
).enableRLS();

export const goalsRelations = relations(goals, ({ one }) => ({
  client: one(clients, { fields: [goals.clientId], references: [clients.id] }),
  targetMetricDefinition: one(metricDefinitions, {
    fields: [goals.targetMetricDefinitionId],
    references: [metricDefinitions.id],
  }),
}));
