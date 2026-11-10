// Applies database migrations. The trip itself is added in the app, in the first run walkthrough.
// Runs before every build, so a fresh deployment needs no manual database step.
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!url) {
  console.log("[migrate] DATABASE_URL is not set, skipping migrations.");
  process.exit(0);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  await migrate(drizzle({ client }), { migrationsFolder: "./drizzle" });
  console.log("[migrate] Migrations applied.");
} finally {
  await client.end();
}
