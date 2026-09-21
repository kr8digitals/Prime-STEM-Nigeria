import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

let realDb: any = null;
export let pool: Pool | null = null;

if (databaseUrl) {
  try {
    pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }
    realDb = drizzle(pool);
  } catch (e) {
    console.warn("Postgres connection failed, falling back to local file storage:", e);
  }
}

// Fallback implementation if DATABASE_URL is not set
const localStorePath = path.join(process.cwd(), "data", "submissions.json");

function saveLocal(type: string, data: any) {
  try {
    const dir = path.dirname(localStorePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let existing: any = { contactMessages: [], registrations: [] };
    if (fs.existsSync(localStorePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(localStorePath, "utf-8"));
      } catch {}
    }
    if (!existing[type]) existing[type] = [];
    existing[type].push({ id: Date.now(), ...data, createdAt: new Date().toISOString() });
    fs.writeFileSync(localStorePath, JSON.stringify(existing, null, 2));
    console.log(`[Local DB] Saved ${type} submission successfully`);
  } catch (err) {
    console.error("[Local DB Error]", err);
  }
}

export const db: any = realDb || {
  execute: async () => ({ rows: [{ ok: 1 }] }),
  insert: (table: any) => ({
    values: async (data: any) => {
      const tableName = table?.dbName || table?._?.name || "registrations";
      saveLocal(tableName, data);
      return { rowCount: 1 };
    },
  }),
  select: () => ({
    from: () => ({
      where: () => [],
      limit: () => [],
    }),
  }),
};
