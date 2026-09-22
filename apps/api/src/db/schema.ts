/**
 * Drizzle mirror of migrations/*.sql for typed queries. The SQL is authoritative.
 * test/integration/schema-drift.test.ts fails if a column here does not exist in the database.
 */
import {
  bigserial,
  boolean,
  char,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const captureMethod = pgEnum('capture_method', [
  'extension_dom',
  'screenshot',
  'share_url',
  'manual',
  'baseline_api',
  'baseline_cleanroom',
]);
export const integrityStatus = pgEnum('integrity_status', [
  'pending',
  'accepted',
  'quarantined',
  'rejected',
]);
export const discountType = pgEnum('discount_type', [
  'none',
  'sale',
  'digital_coupon',
  'loyalty',
  'member',
  'promo_code',
  'bundle',
  'personalized',
  'unknown',
]);
export const platform = pgEnum('platform', [
  'ios',
  'android',
  'chrome',
  'safari',
  'firefox',
  'server',
]);
export const attestationLevel = pgEnum('attestation_level', [
  'none',
  'extension_token',
  'app_attest',
  'play_integrity',
]);
export const baselineSource = pgEnum('baseline_source', ['none', 'api', 'cleanroom']);
export const retailerCategory = pgEnum('retailer_category', [
  'grocery',
  'grocery_delivery',
  'rideshare',
  'food_delivery',
  'travel',
  'general_retail',
]);

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });

export const metros = pgTable('metros', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  state: char('state', { length: 2 }).notNull(),
  zip3: text('zip3').array().notNull().default([]),
});

export const retailers = pgTable('retailers', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  domains: text('domains').array().notNull().default([]),
  category: retailerCategory('category').notNull(),
  parserRecipeVersion: integer('parser_recipe_version').notNull().default(0),
  cleanroomEnabled: boolean('cleanroom_enabled').notNull().default(false),
  baselineSource: baselineSource('baseline_source').notNull().default('none'),
  nyDisclosureExpected: boolean('ny_disclosure_expected').notNull().default(false),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  retailerId: uuid('retailer_id')
    .notNull()
    .references(() => retailers.id),
  nativeId: text('native_id'),
  gtin: text('gtin'),
  brand: text('brand'),
  titleNorm: text('title_norm').notNull(),
  sizeNorm: text('size_norm'),
  variantJson: jsonb('variant_json').notNull().default({}),
  identityConfidence: real('identity_confidence').notNull().default(1),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const serviceProducts = pgTable('service_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  retailerId: uuid('retailer_id')
    .notNull()
    .references(() => retailers.id),
  originCell: text('origin_cell').notNull(),
  destCell: text('dest_cell').notNull(),
  serviceTier: text('service_tier').notNull(),
  timeBucket: text('time_bucket').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey(),
  platform: platform('platform').notNull(),
  attestationLevel: attestationLevel('attestation_level').notNull().default('none'),
  firstSeen: ts('first_seen').notNull().defaultNow(),
  lastSeen: ts('last_seen').notNull().defaultNow(),
  riskScore: real('risk_score').notNull().default(0),
  rotatedFrom: uuid('rotated_from'),
  hmacKeyHash: text('hmac_key_hash'),
  isSynthetic: boolean('is_synthetic').notNull().default(false),
});

export const observations = pgTable('observations', {
  id: uuid('id').notNull().defaultRandom(),
  observedAt: ts('observed_at').notNull(),
  retailerId: uuid('retailer_id').notNull(),
  productId: uuid('product_id'),
  serviceProductId: uuid('service_product_id'),
  deviceId: uuid('device_id').notNull(),
  metro: text('metro').notNull(),
  h3CellCoarse: text('h3_cell_coarse'),
  currency: char('currency', { length: 3 }).notNull().default('USD'),
  listPrice: money('list_price'),
  discountAmount: money('discount_amount'),
  discountLabel: text('discount_label'),
  discountType: discountType('discount_type').notNull().default('none'),
  finalPrice: money('final_price').notNull(),
  feesJson: jsonb('fees_json').notNull().default([]),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull().default('1'),
  unit: text('unit'),
  promoLabels: text('promo_labels').array().notNull().default([]),
  disclosureText: text('disclosure_text'),
  captureMethod: captureMethod('capture_method').notNull(),
  baselinePersona: text('baseline_persona'),
  contentHash: text('content_hash').notNull(),
  captureObjectKey: text('capture_object_key'),
  parserVersion: text('parser_version'),
  appVersion: text('app_version'),
  isSynthetic: boolean('is_synthetic').notNull().default(false),
  ingestedAt: ts('ingested_at').notNull().defaultNow(),
});

export const integrityReviews = pgTable('integrity_reviews', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  observationId: uuid('observation_id').notNull(),
  observedAt: ts('observed_at').notNull(),
  score: smallint('score').notNull(),
  status: integrityStatus('status').notNull(),
  scorerVersion: text('scorer_version').notNull(),
  reasonsJson: jsonb('reasons_json').notNull().default([]),
  reviewer: text('reviewer'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const aggregatesDaily = pgTable('aggregates_daily', {
  retailerId: uuid('retailer_id').notNull(),
  productId: uuid('product_id').notNull(),
  metro: text('metro').notNull(),
  day: date('day', { mode: 'string' }).notNull(),
  isSynthetic: boolean('is_synthetic').notNull().default(false),
  n: integer('n').notNull(),
  nDevices: integer('n_devices').notNull(),
  nPricePoints: integer('n_price_points').notNull(),
  min: money('min').notNull(),
  p10: money('p10').notNull(),
  median: money('median').notNull(),
  max: money('max').notNull(),
  dispersionPct: real('dispersion_pct').notNull(),
  labelBreakdownJson: jsonb('label_breakdown_json').notNull().default({}),
  baselinePrice: money('baseline_price'),
  baselineNoisePct: real('baseline_noise_pct'),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const playbooks = pgTable('playbooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  retailerId: uuid('retailer_id')
    .notNull()
    .references(() => retailers.id),
  version: integer('version').notNull(),
  stepsJson: jsonb('steps_json').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const playbookFeedback = pgTable('playbook_feedback', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  deviceId: uuid('device_id').notNull(),
  retailerId: uuid('retailer_id').notNull(),
  playbookId: uuid('playbook_id').notNull(),
  stepId: text('step_id').notNull(),
  worked: boolean('worked').notNull(),
  deltaPrice: money('delta_price'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const watches = pgTable('watches', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').notNull(),
  retailerId: uuid('retailer_id').notNull(),
  productId: uuid('product_id').notNull(),
  metro: text('metro').notNull(),
  thresholdPct: real('threshold_pct').notNull().default(5),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id'),
  email: text('email'),
  provider: text('provider').notNull(),
  providerRef: text('provider_ref'),
  status: text('status').notNull(),
  currentPeriodEnd: ts('current_period_end'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  valueJson: jsonb('value_json').notNull().default(null),
  description: text('description').notNull().default(''),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const parserRecipes = pgTable('parser_recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  retailerId: uuid('retailer_id').notNull(),
  version: integer('version').notNull(),
  recipeJson: jsonb('recipe_json').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const evidenceExports = pgTable('evidence_exports', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestedBy: text('requested_by').notNull(),
  retailerId: uuid('retailer_id'),
  metro: text('metro'),
  dateFrom: date('date_from', { mode: 'string' }).notNull(),
  dateTo: date('date_to', { mode: 'string' }).notNull(),
  kMin: integer('k_min').notNull().default(10),
  status: text('status').notNull().default('requested'),
  objectKey: text('object_key'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  keyHash: text('key_hash').notNull().unique(),
  name: text('name').notNull(),
  scopes: text('scopes').array().notNull().default([]),
  quotaDaily: integer('quota_daily').notNull().default(1000),
  createdAt: ts('created_at').notNull().defaultNow(),
  revokedAt: ts('revoked_at'),
});

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  target: text('target'),
  detailJson: jsonb('detail_json').notNull().default({}),
  createdAt: ts('created_at').notNull().defaultNow(),
});
