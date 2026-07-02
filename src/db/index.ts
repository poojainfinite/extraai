// ExtraAI does NOT use a database — all data lives in browser localStorage.
// This file exists only for backward compatibility with the health check route.
// You do not need to set DATABASE_URL for this app to work.

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/unused";

const globalForDb = globalThis as typeof globalThis & {
  __extraAiPool?: Pool;
};

export const pool =
  globalForDb.__extraAiPool ??
  new Pool({ connectionString: databaseUrl });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__extraAiPool = pool;
}

export const db = drizzle(pool);
