import { db, sql } from "../db/client";

/** Backwards-compatible ping used by the readiness probe. */
export async function pingDb(): Promise<void> {
  await sql`SELECT 1`;
}

export { db, sql };
