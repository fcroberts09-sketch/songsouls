import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

export type Sql = ReturnType<typeof postgres>;
export type Db = ReturnType<typeof createDb>['db'];

export function createDb(databaseUrl: string, opts: { max?: number } = {}) {
  const sql = postgres(databaseUrl, {
    max: opts.max ?? 10,
    // numeric columns come back as strings by default; keep that for money (no float drift).
    transform: { undefined: null },
    onnotice: () => {},
  });
  const db = drizzle(sql, { schema });
  return { sql, db, close: () => sql.end({ timeout: 5 }) };
}
