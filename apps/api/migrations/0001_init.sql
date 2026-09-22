-- Parity schema, migration 0001. Hand-written SQL is the source of truth; src/db/schema.ts mirrors
-- it for typed queries and an integration test checks the two agree.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE capture_method AS ENUM (
  'extension_dom', 'screenshot', 'share_url', 'manual', 'baseline_api', 'baseline_cleanroom'
);
CREATE TYPE integrity_status AS ENUM ('pending', 'accepted', 'quarantined', 'rejected');
CREATE TYPE discount_type AS ENUM (
  'none', 'sale', 'digital_coupon', 'loyalty', 'member', 'promo_code', 'bundle', 'personalized', 'unknown'
);
CREATE TYPE platform AS ENUM ('ios', 'android', 'chrome', 'safari', 'firefox', 'server');
CREATE TYPE attestation_level AS ENUM ('none', 'extension_token', 'app_attest', 'play_integrity');
CREATE TYPE baseline_source AS ENUM ('none', 'api', 'cleanroom');
CREATE TYPE retailer_category AS ENUM (
  'grocery', 'grocery_delivery', 'rideshare', 'food_delivery', 'travel', 'general_retail'
);

CREATE TABLE metros (
  code  text PRIMARY KEY,
  name  text NOT NULL,
  state char(2) NOT NULL,
  zip3  text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE retailers (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   text NOT NULL UNIQUE,
  name                   text NOT NULL,
  domains                text[] NOT NULL DEFAULT '{}',
  category               retailer_category NOT NULL,
  parser_recipe_version  integer NOT NULL DEFAULT 0,
  cleanroom_enabled      boolean NOT NULL DEFAULT false,
  baseline_source        baseline_source NOT NULL DEFAULT 'none',
  ny_disclosure_expected boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id         uuid NOT NULL REFERENCES retailers(id),
  native_id           text,
  gtin                text,
  brand               text,
  title_norm          text NOT NULL,
  size_norm           text,
  variant_json        jsonb NOT NULL DEFAULT '{}',
  identity_confidence real NOT NULL DEFAULT 1.0 CHECK (identity_confidence >= 0 AND identity_confidence <= 1),
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (retailer_id, native_id)
);
CREATE INDEX products_title_trgm_idx ON products USING gin (title_norm gin_trgm_ops);
CREATE INDEX products_gtin_idx ON products (retailer_id, gtin) WHERE gtin IS NOT NULL;

-- Rideshare, delivery, travel: the "product" is a service tuple. Cells are coarse H3 indexes.
CREATE TABLE service_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id   uuid NOT NULL REFERENCES retailers(id),
  origin_cell   text NOT NULL,
  dest_cell     text NOT NULL,
  service_tier  text NOT NULL,
  time_bucket   text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (retailer_id, origin_cell, dest_cell, service_tier, time_bucket)
);

CREATE TABLE devices (
  id                uuid PRIMARY KEY,
  platform          platform NOT NULL,
  attestation_level attestation_level NOT NULL DEFAULT 'none',
  first_seen        timestamptz NOT NULL DEFAULT now(),
  last_seen         timestamptz NOT NULL DEFAULT now(),
  risk_score        real NOT NULL DEFAULT 0,
  rotated_from      uuid REFERENCES devices(id),
  hmac_key_hash     text,
  is_synthetic      boolean NOT NULL DEFAULT false
);

-- Append-only. Never UPDATE a row here. Integrity decisions live in integrity_reviews.
CREATE TABLE observations (
  id                 uuid NOT NULL DEFAULT gen_random_uuid(),
  observed_at        timestamptz NOT NULL,
  retailer_id        uuid NOT NULL REFERENCES retailers(id),
  product_id         uuid REFERENCES products(id),
  service_product_id uuid REFERENCES service_products(id),
  device_id          uuid NOT NULL REFERENCES devices(id),
  metro              text NOT NULL REFERENCES metros(code),
  h3_cell_coarse     text,
  currency           char(3) NOT NULL DEFAULT 'USD',
  list_price         numeric(12,2),
  discount_amount    numeric(12,2),
  discount_label     text,
  discount_type      discount_type NOT NULL DEFAULT 'none',
  final_price        numeric(12,2) NOT NULL CHECK (final_price >= 0),
  fees_json          jsonb NOT NULL DEFAULT '[]',
  quantity           numeric(12,3) NOT NULL DEFAULT 1,
  unit               text,
  promo_labels       text[] NOT NULL DEFAULT '{}',
  disclosure_text    text,
  capture_method     capture_method NOT NULL,
  baseline_persona   text,
  content_hash       text NOT NULL,
  capture_object_key text,
  parser_version     text,
  app_version        text,
  is_synthetic       boolean NOT NULL DEFAULT false,
  ingested_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, observed_at),
  UNIQUE (content_hash, observed_at),
  CHECK (product_id IS NOT NULL OR service_product_id IS NOT NULL)
) PARTITION BY RANGE (observed_at);

CREATE INDEX observations_lookup_idx ON observations (retailer_id, product_id, metro, observed_at DESC);
CREATE INDEX observations_service_lookup_idx ON observations (retailer_id, service_product_id, metro, observed_at DESC)
  WHERE service_product_id IS NOT NULL;
CREATE INDEX observations_device_idx ON observations (device_id, observed_at DESC);
CREATE INDEX observations_content_hash_idx ON observations (content_hash);

-- Monthly partitions. A maintenance job (Phase 1) creates future months; the default catches stragglers.
CREATE TABLE observations_2026_08 PARTITION OF observations FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE observations_2026_09 PARTITION OF observations FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE observations_2026_10 PARTITION OF observations FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE observations_2026_11 PARTITION OF observations FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE observations_2026_12 PARTITION OF observations FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE observations_2027_01 PARTITION OF observations FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE observations_2027_02 PARTITION OF observations FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
CREATE TABLE observations_2027_03 PARTITION OF observations FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');
CREATE TABLE observations_default PARTITION OF observations DEFAULT;

-- Append-only chain of custody for integrity decisions. Effective status = latest row per observation.
CREATE TABLE integrity_reviews (
  id             bigserial PRIMARY KEY,
  observation_id uuid NOT NULL,
  observed_at    timestamptz NOT NULL,
  score          smallint NOT NULL CHECK (score >= 0 AND score <= 100),
  status         integrity_status NOT NULL,
  scorer_version text NOT NULL,
  reasons_json   jsonb NOT NULL DEFAULT '[]',
  reviewer       text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (observation_id, observed_at) REFERENCES observations(id, observed_at) ON DELETE CASCADE
);
CREATE INDEX integrity_reviews_obs_idx ON integrity_reviews (observation_id, created_at DESC);
CREATE INDEX integrity_reviews_status_idx ON integrity_reviews (status, created_at DESC);

CREATE VIEW observation_status AS
  SELECT DISTINCT ON (observation_id) observation_id, observed_at, score, status, scorer_version, created_at
  FROM integrity_reviews
  ORDER BY observation_id, created_at DESC, id DESC;

-- Worker-maintained rollups. Result Cards read from here, never from raw observations.
CREATE TABLE aggregates_daily (
  retailer_id          uuid NOT NULL REFERENCES retailers(id),
  product_id           uuid NOT NULL REFERENCES products(id),
  metro                text NOT NULL REFERENCES metros(code),
  day                  date NOT NULL,
  is_synthetic         boolean NOT NULL DEFAULT false,
  n                    integer NOT NULL,
  n_devices            integer NOT NULL,
  n_price_points       integer NOT NULL,
  min                  numeric(12,2) NOT NULL,
  p10                  numeric(12,2) NOT NULL,
  median               numeric(12,2) NOT NULL,
  max                  numeric(12,2) NOT NULL,
  dispersion_pct       real NOT NULL,
  label_breakdown_json jsonb NOT NULL DEFAULT '{}',
  baseline_price       numeric(12,2),
  baseline_noise_pct   real,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (retailer_id, product_id, metro, day, is_synthetic)
);

CREATE TABLE playbooks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id),
  version     integer NOT NULL,
  steps_json  jsonb NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (retailer_id, version)
);

CREATE TABLE playbook_feedback (
  id          bigserial PRIMARY KEY,
  device_id   uuid NOT NULL REFERENCES devices(id),
  retailer_id uuid NOT NULL REFERENCES retailers(id),
  playbook_id uuid NOT NULL REFERENCES playbooks(id),
  step_id     text NOT NULL,
  worked      boolean NOT NULL,
  delta_price numeric(12,2),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX playbook_feedback_step_idx ON playbook_feedback (retailer_id, step_id);

CREATE TABLE watches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     uuid NOT NULL REFERENCES devices(id),
  retailer_id   uuid NOT NULL REFERENCES retailers(id),
  product_id    uuid NOT NULL REFERENCES products(id),
  metro         text NOT NULL REFERENCES metros(code),
  threshold_pct real NOT NULL DEFAULT 5,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, retailer_id, product_id, metro)
);

-- Email lives here and nowhere near observations.
CREATE TABLE subscriptions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id          uuid REFERENCES devices(id),
  email              text,
  provider           text NOT NULL,
  provider_ref       text,
  status             text NOT NULL,
  current_period_end timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feature_flags (
  key         text PRIMARY KEY,
  enabled     boolean NOT NULL DEFAULT false,
  value_json  jsonb NOT NULL DEFAULT 'null',
  description text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parser_recipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES retailers(id),
  version     integer NOT NULL,
  recipe_json jsonb NOT NULL,
  is_active   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (retailer_id, version)
);

CREATE TABLE evidence_exports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by text NOT NULL,
  retailer_id  uuid REFERENCES retailers(id),
  metro        text REFERENCES metros(code),
  date_from    date NOT NULL,
  date_to      date NOT NULL,
  k_min        integer NOT NULL DEFAULT 10 CHECK (k_min >= 10),
  status       text NOT NULL DEFAULT 'requested',
  object_key   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash    text NOT NULL UNIQUE,
  name        text NOT NULL,
  scopes      text[] NOT NULL DEFAULT '{}',
  quota_daily integer NOT NULL DEFAULT 1000,
  created_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz
);

CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  actor       text NOT NULL,
  action      text NOT NULL,
  target      text,
  detail_json jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);
