/**
 * Minimal forward-only SQL migrator. Files in ./migrations run in name order inside one
 * transaction each; applied versions are recorded in schema_migrations. Re-running is a no-op.
 * Deliberately boring: a non-engineer can read the SQL files and know exactly what the schema is.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { loadConfig } from '../config.js';

const here = dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = join(here, '..', '..', 'migrations');

export async function migrate(databaseUrl: string, log: (m: string) => void = console.log) {
  const sql = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
    // Serialize concurrent migrators (e.g. two API replicas booting).
    await sql`SELECT pg_advisory_lock(727170)`;
    try {
      const applied = new Set(
        (await sql`SELECT version FROM schema_migrations`).map((r) => r.version as string),
      );
      const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
      let count = 0;
      for (const file of files) {
        const version = file.replace(/\.sql$/, '');
        if (applied.has(version)) continue;
        const body = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
        await sql.begin(async (tx) => {
          await tx.unsafe(body);
          await tx`INSERT INTO schema_migrations (version) VALUES (${version})`;
        });
        log(`applied ${version}`);
        count++;
      }
      log(count === 0 ? 'schema up to date' : `applied ${count} migration(s)`);
      return count;
    } finally {
      await sql`SELECT pg_advisory_unlock(727170)`;
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const config = loadConfig();
  migrate(config.DATABASE_URL).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
