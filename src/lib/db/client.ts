import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";

import * as schema from "./schema";

/**
 * Lazily-initialized Drizzle client.
 *
 * We don't connect at module load time: this file is imported by
 * server code across the app, and eagerly opening a connection (or
 * throwing when `DATABASE_URL` is unset) would break every route that
 * merely imports something adjacent to it, including in environments
 * — like this early foundation module — where no schema has been
 * deployed yet. `getDb()` throws only when a caller actually tries to
 * use the database without one configured, which is the correct place
 * for that failure to surface.
 *
 * In serverless/edge-adjacent deployments a single module-level
 * connection is reused across invocations of the same instance, which
 * is what we want — `postgres-js` pools internally.
 */
let queryClient: ReturnType<typeof postgres> | undefined;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in your environment before performing database operations."
    );
  }

  if (!dbInstance) {
    queryClient = postgres(env.DATABASE_URL, { prepare: false });
    dbInstance = drizzle(queryClient, { schema });
  }

  return dbInstance;
}
