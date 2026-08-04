import { z } from "zod";

/**
 * Centralized, validated access to environment variables.
 *
 * Every module reads configuration through `env`, never through raw
 * `process.env` — a misconfigured deployment should fail loudly at
 * startup, not silently produce `undefined` three layers deep inside a
 * client's meal plan. Server-only secrets are kept out of the schema
 * consumed by client components by splitting server/client schemas.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .url()
    .optional()
    .describe("Postgres connection string. Required once Module 1 lands the schema."),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

function parseServerEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables — see log above.");
  }
  return parsed.data;
}

function parseClientEnv() {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    console.error("❌ Invalid public environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid public environment variables — see log above.");
  }
  return parsed.data;
}

export const env = {
  ...parseClientEnv(),
  ...(typeof window === "undefined" ? parseServerEnv() : ({} as ReturnType<typeof parseServerEnv>)),
};
