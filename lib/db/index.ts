import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reuse one pool across hot reloads and warm serverless invocations.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  (globalForDb.pgPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 }));

export const db = drizzle({ client: pool, schema });
