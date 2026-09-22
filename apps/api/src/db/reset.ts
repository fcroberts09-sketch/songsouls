/** Drops and recreates the public schema. Development and test only; refuses to run in production. */
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { loadConfig } from '../config.js';

export async function resetSchema(databaseUrl: string, nodeEnv: string) {
  if (nodeEnv === 'production') throw new Error('refusing to reset schema in production');
  const sql = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const config = loadConfig();
  resetSchema(config.DATABASE_URL, config.NODE_ENV)
    .then(() => console.log('schema reset'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
