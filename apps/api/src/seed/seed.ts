/**
 * Seed: 4 metros, 4 retailers, 50 products, 4 service tuples, ~160 synthetic devices,
 * 2,000 synthetic crowd observations plus ~430 synthetic baseline twin observations,
 * an integrity review per observation, playbooks, feature flags, parser recipes, and daily rollups.
 *
 * Deterministic (seeded PRNG) so tests are stable. Every synthetic row is is_synthetic = true and the
 * rollup keeps synthetic and real aggregates apart. Re-running deletes synthetic rows first and upserts
 * reference data, so the script is safe to run repeatedly.
 */
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { METROS, METRO_CODES, canonicalJson } from '@parity/shared';
import { loadConfig } from '../config.js';
import { playbookSteps, productsFor, uberTuples } from './catalog.js';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260922);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
const uuidFrom = (s: string) => {
  const h = createHash('sha256').update(s).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export const SEED_COUNTS = {
  retailers: 4,
  products: 50,
  serviceProducts: 4,
  devices: 160,
  crowdObservations: 2000,
};

export async function seed(databaseUrl: string, log: (m: string) => void = console.log) {
  const sql = postgres(databaseUrl, { max: 4, onnotice: () => {} });
  try {
    await sql.begin(async (tx) => {
      // 1. Wipe synthetic data (append-only tables are allowed to lose synthetic rows; they are not evidence).
      await tx`DELETE FROM aggregates_daily WHERE is_synthetic`;
      await tx`DELETE FROM observations WHERE is_synthetic`;
      await tx`DELETE FROM playbook_feedback WHERE device_id IN (SELECT id FROM devices WHERE is_synthetic)`;
      await tx`DELETE FROM watches WHERE device_id IN (SELECT id FROM devices WHERE is_synthetic)`;
      await tx`DELETE FROM devices WHERE is_synthetic`;

      // 2. Metros
      for (const code of METRO_CODES) {
        const m = METROS[code];
        await tx`INSERT INTO metros (code, name, state, zip3) VALUES (${code}, ${m.name}, ${m.state}, ${[...m.zip3]})
                 ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, zip3 = EXCLUDED.zip3`;
      }

      // 3. Retailers. Baseline sources follow docs/RESEARCH.md: Kroger via official API, H-E-B clean-room only with
      //    counsel sign-off (flag off), Instacart and Uber never.
      const retailerRows = [
        {
          slug: 'kroger',
          name: 'Kroger',
          domains: ['kroger.com'],
          category: 'grocery',
          baseline_source: 'api',
          ny: false,
        },
        {
          slug: 'heb',
          name: 'H-E-B',
          domains: ['heb.com'],
          category: 'grocery',
          baseline_source: 'cleanroom',
          ny: false,
        },
        {
          slug: 'instacart',
          name: 'Instacart',
          domains: ['instacart.com'],
          category: 'grocery_delivery',
          baseline_source: 'none',
          ny: true,
        },
        {
          slug: 'uber',
          name: 'Uber',
          domains: ['uber.com'],
          category: 'rideshare',
          baseline_source: 'none',
          ny: true,
        },
      ] as const;
      const retailerIds: Record<string, string> = {};
      for (const r of retailerRows) {
        const [row] = await tx`
          INSERT INTO retailers (slug, name, domains, category, baseline_source, ny_disclosure_expected, cleanroom_enabled)
          VALUES (${r.slug}, ${r.name}, ${[...r.domains]}, ${r.category}, ${r.baseline_source}, ${r.ny}, false)
          ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, domains = EXCLUDED.domains, category = EXCLUDED.category,
            baseline_source = EXCLUDED.baseline_source, ny_disclosure_expected = EXCLUDED.ny_disclosure_expected
          RETURNING id`;
        retailerIds[r.slug] = row!.id as string;
      }

      // 4. Products: 18 Kroger, 18 H-E-B, 14 Instacart = 50
      const catalog = [
        ...productsFor('kroger', '00', 18).map((p) => ({ ...p, slug: 'kroger' })),
        ...productsFor('heb', '1', 18).map((p) => ({ ...p, slug: 'heb' })),
        ...productsFor('instacart', 'item_', 14).map((p) => ({ ...p, slug: 'instacart' })),
      ];
      const products: { id: string; slug: string; retailer_id: string; base: number }[] = [];
      for (const p of catalog) {
        const [row] = await tx`
          INSERT INTO products (retailer_id, native_id, gtin, brand, title_norm, size_norm, identity_confidence)
          VALUES (${retailerIds[p.slug]!}, ${p.native_id}, ${p.gtin}, ${p.brand}, ${p.title.toLowerCase()}, ${p.size}, 1.0)
          ON CONFLICT (retailer_id, native_id) DO UPDATE SET gtin = EXCLUDED.gtin, brand = EXCLUDED.brand,
            title_norm = EXCLUDED.title_norm, size_norm = EXCLUDED.size_norm
          RETURNING id`;
        products.push({
          id: row!.id as string,
          slug: p.slug,
          retailer_id: retailerIds[p.slug]!,
          base: p.base,
        });
      }

      // 5. Service tuples (Uber)
      const serviceProducts: { id: string; base: number }[] = [];
      for (const t of uberTuples) {
        const [row] = await tx`
          INSERT INTO service_products (retailer_id, origin_cell, dest_cell, service_tier, time_bucket)
          VALUES (${retailerIds.uber!}, ${t.origin_cell}, ${t.dest_cell}, ${t.service_tier}, ${t.time_bucket})
          ON CONFLICT (retailer_id, origin_cell, dest_cell, service_tier, time_bucket) DO UPDATE SET service_tier = EXCLUDED.service_tier
          RETURNING id`;
        serviceProducts.push({ id: row!.id as string, base: t.base });
      }

      // 6. Devices: 40 per metro, mixed platforms and attestation
      const devicesByMetro: Record<string, string[]> = {};
      const platforms = ['ios', 'android', 'chrome', 'safari'] as const;
      for (const metro of METRO_CODES) {
        devicesByMetro[metro] = [];
        for (let i = 0; i < 40; i++) {
          const id = uuidFrom(`device:${metro}:${i}`);
          const platform = pick(platforms);
          const level =
            rand() < 0.7
              ? platform === 'ios'
                ? 'app_attest'
                : platform === 'android'
                  ? 'play_integrity'
                  : 'extension_token'
              : 'none';
          await tx`INSERT INTO devices (id, platform, attestation_level, is_synthetic, risk_score)
                   VALUES (${id}, ${platform}, ${level}, true, ${round2(rand() * 0.2)})`;
          devicesByMetro[metro].push(id);
        }
      }
      const serverDevice = uuidFrom('device:server:baseline');
      await tx`INSERT INTO devices (id, platform, attestation_level, is_synthetic) VALUES (${serverDevice}, 'server', 'none', true)`;

      // 7. Crowd observations: 2,000 over the last 14 days. Offer model per observation:
      //    65% sticker, 20% digital coupon (10-25% off), 10% member price (5-12% off), 5% higher (5-12% up).
      const now = Date.now();
      const dayMs = 86_400_000;
      const captureMethods = ['extension_dom', 'screenshot', 'screenshot', 'share_url'] as const;
      type Obs = Record<string, unknown>;
      const rows: Obs[] = [];
      // The first SPOTLIGHT observations are concentrated: 5 Kroger products, Houston, last 2 days, 20 each,
      // so the demo has cells dense enough to show a real distribution. The rest are spread thinly, which is
      // what a pilot actually looks like.
      const spotlight = products.filter((p) => p.slug === 'kroger').slice(0, 5);
      const SPOTLIGHT = spotlight.length * 2 * 20;
      for (let i = 0; i < SEED_COUNTS.crowdObservations; i++) {
        const inSpotlight = i < SPOTLIGHT;
        const isService = !inSpotlight && rand() < 0.06;
        const metro = inSpotlight || isService ? 'HOU' : pick(METRO_CODES);
        const device = pick(devicesByMetro[metro]!);
        const observedAt = inSpotlight
          ? new Date(
              now -
                Math.floor(i / (spotlight.length * 20)) * dayMs -
                6 * 3_600_000 -
                Math.floor(rand() * 8 * 3_600_000),
            )
          : new Date(now - Math.floor(rand() * 14) * dayMs - Math.floor(rand() * dayMs));
        const r = rand();
        let list: number | null = null;
        let discountAmount: number | null = null;
        let label: string | null = null;
        let type = 'none';
        let final: number;
        let base: number;
        let productId: string | null = null;
        let serviceProductId: string | null = null;
        let retailerId: string;
        let promo: string[] = [];
        if (isService) {
          const sp = pick(serviceProducts);
          serviceProductId = sp.id;
          retailerId = retailerIds.uber!;
          base = sp.base;
          // rideshare: wide spread, occasional "discount" against an inflated reference
          final = round2(base * between(0.85, 1.45));
          if (rand() < 0.3) {
            list = round2(final * between(1.1, 1.3));
            discountAmount = round2(list - final);
            label = 'Promo applied';
            type = 'promo_code';
          }
        } else {
          const p = inSpotlight
            ? spotlight[Math.floor(i / 20) % spotlight.length]!
            : pick(products);
          productId = p.id;
          retailerId = p.retailer_id;
          base = p.base;
          if (r < 0.65) {
            final = base;
          } else if (r < 0.85) {
            const pct = between(0.1, 0.25);
            list = base;
            final = round2(base * (1 - pct));
            discountAmount = round2(base - final);
            label = 'Digital Coupon';
            type = 'digital_coupon';
            promo = ['Digital Coupon'];
          } else if (r < 0.95) {
            const pct = between(0.05, 0.12);
            list = base;
            final = round2(base * (1 - pct));
            discountAmount = round2(base - final);
            label = p.slug === 'instacart' ? 'Instacart+ price' : 'Member price';
            type = 'member';
            promo = [label];
          } else {
            final = round2(base * between(1.05, 1.12));
          }
        }
        const captureMethod = pick(captureMethods);
        const content = canonicalJson({
          v: 1,
          device_id: device,
          device_nonce: `seed-${i}`,
          observed_at: observedAt.toISOString(),
          metro,
          product: productId ?? serviceProductId,
          final,
          label,
          type,
          captureMethod,
        });
        rows.push({
          observed_at: observedAt,
          retailer_id: retailerId,
          product_id: productId,
          service_product_id: serviceProductId,
          device_id: device,
          metro,
          list_price: list,
          discount_amount: discountAmount,
          discount_label: label,
          discount_type: type,
          final_price: final,
          promo_labels: promo,
          disclosure_text: null,
          capture_method: captureMethod,
          baseline_persona: null,
          content_hash: createHash('sha256').update(content).digest('hex'),
          parser_version: captureMethod === 'extension_dom' ? 'seed-recipe-1' : null,
          app_version: 'seed',
          is_synthetic: true,
        });
      }

      // 8. Baseline twins for Kroger products: two identical anonymous API sessions per product/metro/day for the
      //    last 3 days. Their disagreement is the measured noise floor. Kroger sits at the base price with tiny jitter.
      const krogerProducts = products.filter((p) => p.slug === 'kroger');
      for (const p of krogerProducts) {
        for (const metro of ['HOU', 'DFW'] as const) {
          for (let d = 0; d < 3; d++) {
            for (const persona of ['twin-a', 'twin-b']) {
              const observedAt = new Date(now - d * dayMs - 3 * 3_600_000);
              const final = round2(
                p.base * (persona === 'twin-b' && rand() < 0.15 ? between(0.99, 1.01) : 1),
              );
              const content = canonicalJson({
                v: 1,
                baseline: true,
                product: p.id,
                metro,
                d,
                persona,
                final,
              });
              rows.push({
                observed_at: observedAt,
                retailer_id: p.retailer_id,
                product_id: p.id,
                service_product_id: null,
                device_id: serverDevice,
                metro,
                list_price: null,
                discount_amount: null,
                discount_label: null,
                discount_type: 'none',
                final_price: final,
                promo_labels: [],
                disclosure_text: null,
                capture_method: 'baseline_api',
                baseline_persona: persona,
                content_hash: createHash('sha256').update(content).digest('hex'),
                parser_version: 'kroger-api-1',
                app_version: 'seed',
                is_synthetic: true,
              });
            }
          }
        }
      }

      const inserted = await tx`
        INSERT INTO observations ${tx(
          rows,
          'observed_at',
          'retailer_id',
          'product_id',
          'service_product_id',
          'device_id',
          'metro',
          'list_price',
          'discount_amount',
          'discount_label',
          'discount_type',
          'final_price',
          'promo_labels',
          'disclosure_text',
          'capture_method',
          'baseline_persona',
          'content_hash',
          'parser_version',
          'app_version',
          'is_synthetic',
        )}
        RETURNING id, observed_at, capture_method`;

      // 9. One integrity review per observation: 92% accepted, 6% quarantined, 2% rejected; baselines always accepted.
      const reviews = inserted.map((o) => {
        const r = rand();
        const isBaseline = String(o.capture_method).startsWith('baseline_');
        const status = isBaseline || r < 0.92 ? 'accepted' : r < 0.98 ? 'quarantined' : 'rejected';
        const score =
          status === 'accepted'
            ? Math.floor(between(70, 100))
            : status === 'quarantined'
              ? Math.floor(between(40, 69))
              : Math.floor(between(0, 39));
        return {
          observation_id: o.id,
          observed_at: o.observed_at,
          score,
          status,
          scorer_version: 'seed-0',
          reasons_json: JSON.stringify(
            status === 'accepted' ? [] : [{ rule: 'seed_random', detail: 'synthetic outcome' }],
          ),
          reviewer: null,
        };
      });
      await tx`INSERT INTO integrity_reviews ${tx(reviews, 'observation_id', 'observed_at', 'score', 'status', 'scorer_version', 'reasons_json', 'reviewer')}`;

      // 10. Playbooks (version 1, upsert), feature flags, parser recipes
      for (const [slug, steps] of Object.entries(playbookSteps)) {
        await tx`INSERT INTO playbooks (retailer_id, version, steps_json, is_active) VALUES (${retailerIds[slug]!}, 1, ${JSON.stringify(steps)}, true)
                 ON CONFLICT (retailer_id, version) DO UPDATE SET steps_json = EXCLUDED.steps_json`;
      }
      const flags = [
        [
          'cleanroom.kill_switch',
          true,
          null,
          'Global kill switch for the clean-room fetcher. Enabled means STOP.',
        ],
        [
          'cleanroom.domain.heb.com',
          false,
          null,
          'Clean-room baseline for heb.com. Requires counsel sign-off (DECISIONS_NEEDED #5).',
        ],
        [
          'cleanroom.domain.walmart.com',
          false,
          null,
          'Clean-room baseline for walmart.com. Requires counsel sign-off.',
        ],
        ['baseline.kroger_api', true, null, 'Kroger official Public Products API baseline.'],
        [
          'demo_mode.enabled',
          true,
          null,
          'Allow clients to request Demo Mode result cards from synthetic data.',
        ],
        [
          'integrity.min_corroboration_devices',
          true,
          3,
          'Distinct attested devices required before "lowest seen" is shown.',
        ],
        ['card.window_hours', true, 24, 'Window for the network distribution on a Result Card.'],
        ['export.k_min', true, 10, 'Minimum k for any public or evidence export. Never below 10.'],
      ] as const;
      for (const [key, enabled, value, description] of flags) {
        await tx`INSERT INTO feature_flags (key, enabled, value_json, description) VALUES (${key}, ${enabled}, ${JSON.stringify(value)}, ${description})
                 ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description`;
      }
      const recipes = {
        heb: {
          retailer_slug: 'heb',
          version: 1,
          product_url_patterns: ['^https://www\\.heb\\.com/product-detail/'],
          native_id_from_url: '/product-detail/[^/]+/(\\d+)',
          fields: {
            title: { selector: 'h1' },
            final_price: { selector: '[data-qe-id="productPrice"]', regex: '\\$([0-9.]+)' },
          },
          do_not_parse_if: ['#px-captcha', 'form[action*="login"]'],
        },
        kroger: {
          retailer_slug: 'kroger',
          version: 1,
          product_url_patterns: ['^https://www\\.kroger\\.com/p/'],
          native_id_from_url: '/p/[^/]+/(\\d+)',
          fields: {
            title: { selector: 'h1' },
            final_price: {
              selector: '[data-testid="cart-page-item-unit-price"], .kds-Price',
              regex: '\\$([0-9.]+)',
            },
          },
          do_not_parse_if: ['#px-captcha'],
        },
      };
      for (const [slug, recipe] of Object.entries(recipes)) {
        await tx`INSERT INTO parser_recipes (retailer_id, version, recipe_json, is_active) VALUES (${retailerIds[slug]!}, 1, ${JSON.stringify(recipe)}, false)
                 ON CONFLICT (retailer_id, version) DO UPDATE SET recipe_json = EXCLUDED.recipe_json`;
      }

      // 11. Rollups for the seeded window
      const rollup =
        await tx`SELECT rollup_aggregates_daily((now() - interval '20 days')::date, now()::date) AS n`;
      log(
        `seeded ${products.length} products, ${rows.length} observations, ${rollup[0]?.n} daily aggregates`,
      );
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const config = loadConfig();
  if (config.NODE_ENV === 'production') {
    console.error('refusing to seed synthetic data in production');
    process.exit(1);
  }
  seed(config.DATABASE_URL).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
