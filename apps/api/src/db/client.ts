import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../config/env";
import * as schema from "./schema";

/**
 * Single shared postgres.js connection + Drizzle instance.
 * Note: Drizzle is used for schema + types + queries only.
 * Migrations are managed by dbmate (never drizzle-kit).
 */
const queryClient = postgres(env.DATABASE_URL, {
  max: env.PG_POOL_MAX,
  idle_timeout: 20,
  prepare: false,
});

export const db = drizzle(queryClient, { schema });
export const sql = queryClient;

export type Db = typeof db;
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function closeDb(): Promise<void> {
  await queryClient.end({ timeout: 5 });
}
