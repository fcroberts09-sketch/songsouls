/**
 * Apply pending SQL migrations against the database pointed at by
 * DATABASE_URL. Each migration runs in a transaction and is recorded in a
 * `_migrations` table so re-running is a no-op.
 *
 * Usage:
 *   vercel env pull .env.local         # one-time, pulls DATABASE_URL
 *   npm run db:migrate
 */

import { Pool } from "@neondatabase/serverless";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";

// Load .env.local for local runs (Vercel deploys read env from the platform).
config({ path: ".env.local" });

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Run `vercel env pull .env.local` first, or set it in your environment."
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       text        PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        "SELECT 1 FROM _migrations WHERE name = $1",
        [file]
      );
      if (rows.length > 0) {
        console.log(`  already applied: ${file}`);
        continue;
      }

      const sqlText = await readFile(path.join(MIGRATIONS_DIR, file), "utf-8");
      console.log(`→ applying:        ${file}`);

      await client.query("BEGIN");
      try {
        await client.query(sqlText);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  applied:         ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    console.log("\nMigrations up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
