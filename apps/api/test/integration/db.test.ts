/**
 * Runs against a real Postgres that has been migrated and seeded (CI does both before this project).
 * If the schema is empty, this file migrates and seeds itself so `pnpm test:integration` works locally too.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { loadConfig } from '../../src/config.js';
import { migrate } from '../../src/db/migrate.js';
import { seed, SEED_COUNTS } from '../../src/seed/seed.js';
import * as schema from '../../src/db/schema.js';

const config = loadConfig({ ...process.env, NODE_ENV: 'test' });
const sql = postgres(config.DATABASE_URL, { max: 2, onnotice: () => {} });

beforeAll(async () => {
  await migrate(config.DATABASE_URL, () => {});
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM retailers`;
  if (count === 0) await seed(config.DATABASE_URL, () => {});
});
afterAll(() => sql.end({ timeout: 5 }));

describe('migrations', () => {
  it('are idempotent', async () => {
    expect(await migrate(config.DATABASE_URL, () => {})).toBe(0);
  });
  it('created a partitioned observations table with a default partition', async () => {
    const parts =
      await sql`SELECT inhrelid::regclass::text AS name FROM pg_inherits WHERE inhparent = 'observations'::regclass ORDER BY 1`;
    expect(parts.map((p) => p.name)).toContain('observations_default');
    expect(parts.length).toBeGreaterThanOrEqual(9);
  });
  it('has pg_trgm available for fuzzy product matching', async () => {
    const [{ ok }] =
      await sql`SELECT count(*)::int = 1 AS ok FROM pg_extension WHERE extname = 'pg_trgm'`;
    expect(ok).toBe(true);
  });
});

describe('drizzle schema mirrors the SQL', () => {
  const tables = Object.values(schema).filter(
    (v): v is (typeof schema)['retailers'] =>
      typeof v === 'object' && v !== null && Symbol.for('drizzle:Name') in (v as object),
  );
  it('finds every drizzle column in information_schema', async () => {
    expect(tables.length).toBeGreaterThan(10);
    for (const table of tables) {
      const name = getTableName(table);
      const cols =
        await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${name}`;
      const dbCols = new Set(cols.map((c) => c.column_name as string));
      expect(dbCols.size, `table ${name} missing from database`).toBeGreaterThan(0);
      for (const col of Object.values(getTableColumns(table))) {
        expect(dbCols.has(col.name), `${name}.${col.name} in schema.ts but not in SQL`).toBe(true);
      }
      for (const dbCol of dbCols) {
        const inTs = Object.values(getTableColumns(table)).some((c) => c.name === dbCol);
        expect(inTs, `${name}.${dbCol} in SQL but not in schema.ts`).toBe(true);
      }
    }
  });
});

describe('seed', () => {
  it('loads the documented counts, all marked synthetic', async () => {
    const [r] = await sql`SELECT count(*)::int AS n FROM retailers`;
    const [p] = await sql`SELECT count(*)::int AS n FROM products`;
    const [d] = await sql`SELECT count(*)::int AS n FROM devices WHERE is_synthetic`;
    const [o] =
      await sql`SELECT count(*)::int AS n FROM observations WHERE is_synthetic AND capture_method NOT IN ('baseline_api', 'baseline_cleanroom')`;
    const [real] = await sql`SELECT count(*)::int AS n FROM observations WHERE NOT is_synthetic`;
    expect(r!.n).toBe(SEED_COUNTS.retailers);
    expect(p!.n).toBe(SEED_COUNTS.products);
    expect(d!.n).toBe(SEED_COUNTS.devices + 1);
    expect(o!.n).toBe(SEED_COUNTS.crowdObservations);
    expect(real!.n).toBe(0);
  });
  it('gives every observation exactly one integrity decision and never aggregates non-accepted rows', async () => {
    const [missing] =
      await sql`SELECT count(*)::int AS n FROM observations o LEFT JOIN observation_status s ON s.observation_id = o.id WHERE s.observation_id IS NULL`;
    expect(missing!.n).toBe(0);
    const [agg] =
      await sql`SELECT count(*)::int AS n, bool_and(is_synthetic) AS all_synth FROM aggregates_daily`;
    expect(agg!.n).toBeGreaterThan(100);
    expect(agg!.all_synth).toBe(true);
    // Reconstruct one aggregate by hand and compare.
    const [row] = await sql`SELECT * FROM aggregates_daily ORDER BY n DESC LIMIT 1`;
    const [check] = await sql`
      SELECT count(*)::int AS n, min(o.final_price) AS min, max(o.final_price) AS max
      FROM observations o JOIN observation_status s ON s.observation_id = o.id
      WHERE o.retailer_id = ${row!.retailer_id} AND o.product_id = ${row!.product_id} AND o.metro = ${row!.metro}
        AND (o.observed_at AT TIME ZONE 'America/Chicago')::date = ${row!.day}
        AND s.status = 'accepted' AND o.capture_method NOT IN ('baseline_api', 'baseline_cleanroom')`;
    expect(check!.n).toBe(row!.n);
    expect(check!.min).toBe(row!.min);
    expect(check!.max).toBe(row!.max);
  });
  it('records the baseline noise floor from twin sessions and keeps baselines out of the crowd count', async () => {
    const rows =
      await sql`SELECT baseline_price, baseline_noise_pct FROM aggregates_daily WHERE baseline_price IS NOT NULL`;
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(Number(r.baseline_noise_pct)).toBeLessThan(2);
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM observations o JOIN aggregates_daily a
      ON a.retailer_id = o.retailer_id AND a.product_id = o.product_id AND a.metro = o.metro
      WHERE o.capture_method = 'baseline_api' AND a.n_devices = 0`;
    expect(n).toBe(0);
  });
  it('shows dispersion: most Kroger product-days have more than one price point', async () => {
    const [{ share }] = await sql`
      SELECT avg(CASE WHEN n_price_points > 1 THEN 1.0 ELSE 0.0 END) AS share
      FROM aggregates_daily a JOIN retailers r ON r.id = a.retailer_id WHERE r.slug = 'kroger' AND a.n >= 3`;
    expect(Number(share)).toBeGreaterThan(0.5);
  });
  it('has spotlight cells dense enough for the demo (n >= 10, several price points, baseline present)', async () => {
    const rows =
      await sql`SELECT n, n_devices, n_price_points, baseline_price FROM aggregates_daily WHERE metro = 'HOU' AND n >= 10`;
    expect(rows.length).toBeGreaterThanOrEqual(5);
    for (const r of rows) {
      expect(r.n_devices).toBeGreaterThanOrEqual(3);
      expect(r.n_price_points).toBeGreaterThanOrEqual(3);
    }
    expect(rows.some((r) => r.baseline_price !== null)).toBe(true);
  });
  it('label breakdown counts sum to n for every aggregate', async () => {
    const [{ bad }] = await sql`
      SELECT count(*)::int AS bad FROM aggregates_daily a
      WHERE (SELECT coalesce(sum(value::int), 0) FROM jsonb_each_text(a.label_breakdown_json)) <> a.n`;
    expect(bad).toBe(0);
  });
  it('is idempotent: re-seeding leaves the same counts', async () => {
    await seed(config.DATABASE_URL, () => {});
    const [o] =
      await sql`SELECT count(*)::int AS n FROM observations WHERE is_synthetic AND capture_method NOT IN ('baseline_api', 'baseline_cleanroom')`;
    expect(o!.n).toBe(SEED_COUNTS.crowdObservations);
  });
});

describe('append-only observations', () => {
  it('rejects a duplicate content hash for the same observed_at (idempotent ingestion)', async () => {
    const [o] =
      await sql`SELECT observed_at, retailer_id, product_id, device_id, metro, final_price, capture_method, content_hash FROM observations WHERE product_id IS NOT NULL LIMIT 1`;
    await expect(
      sql`INSERT INTO observations (observed_at, retailer_id, product_id, device_id, metro, final_price, capture_method, content_hash, is_synthetic)
          VALUES (${o!.observed_at}, ${o!.retailer_id}, ${o!.product_id}, ${o!.device_id}, ${o!.metro}, ${o!.final_price}, ${o!.capture_method}, ${o!.content_hash}, true)`,
    ).rejects.toThrow(/duplicate key/);
  });
  it('requires either a product or a service product', async () => {
    const [o] =
      await sql`SELECT observed_at, retailer_id, device_id, metro FROM observations LIMIT 1`;
    await expect(
      sql`INSERT INTO observations (observed_at, retailer_id, device_id, metro, final_price, capture_method, content_hash, is_synthetic)
          VALUES (${o!.observed_at}, ${o!.retailer_id}, ${o!.device_id}, ${o!.metro}, 1, 'manual', 'x', true)`,
    ).rejects.toThrow(/check constraint/);
  });
});
