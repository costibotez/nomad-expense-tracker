// Applies database migrations and loads the itinerary the first time.
// Runs before every build, so a fresh deployment needs no manual database step.
import { readFileSync } from "node:fs";
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

  const { rows } = await client.query("select count(*)::int as count from legs");
  if (rows[0].count === 0) {
    const legs = JSON.parse(
      readFileSync(new URL("./legs-seed.json", import.meta.url), "utf8"),
    );
    for (const leg of legs) {
      await client.query(
        "insert into legs (country, flag, cities, start_date, end_date, currency) values ($1, $2, $3, $4, $5, $6)",
        [leg.country, leg.flag, leg.cities, leg.startDate, leg.endDate, leg.currency],
      );
    }
    console.log(`[migrate] Loaded ${legs.length} trip legs.`);
  }
} finally {
  await client.end();
}
