import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

let realDb: any = null;
export let pool: Pool | null = null;

if (databaseUrl && databaseUrl.trim().length > 0) {
  try {
    pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }
    realDb = drizzle(pool, { schema });
  } catch (e) {
    throw new Error("Unable to initialize PostgreSQL", { cause: e });
  }
}

// Never report a successful database operation when no database is configured.
export const db: any = realDb || {
  execute: async () => { throw new Error("DATABASE_URL is not configured"); },
};
