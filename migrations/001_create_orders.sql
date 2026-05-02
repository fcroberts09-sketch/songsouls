-- 001_create_orders.sql
-- Phase 1: orders schema for SongSouls payment + delivery system.

-- Status enum (idempotent — first migration run creates it, re-runs no-op).
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'draft',
    'pending_payment',
    'paid',
    'in_production',
    'qc_review',
    'ready',
    'delivered',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Orders table.
CREATE TABLE IF NOT EXISTS orders (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number             text          NOT NULL UNIQUE,
  customer_email           text          NOT NULL,
  status                   order_status  NOT NULL DEFAULT 'draft',
  lyrics_json              jsonb,
  genre                    text,
  recipient_name           text,
  occasion                 text,
  stripe_session_id        text,
  stripe_payment_intent_id text,
  price_cents              integer       NOT NULL DEFAULT 0,
  currency                 text          NOT NULL DEFAULT 'usd',
  song_file_url            text,
  lyrics_pdf_url           text,
  magic_link_token         text,
  magic_link_expires_at    timestamptz,
  delivered_at             timestamptz,
  created_at               timestamptz   NOT NULL DEFAULT now(),
  updated_at               timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT order_number_format
    CHECK (order_number ~ '^SS-[0-9]{4}-[A-Z0-9]{6}$')
);

-- Indexes.
-- Note: the UNIQUE constraint on order_number already creates a btree index,
-- so no separate orders_order_number_idx is needed.
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders (customer_email);
CREATE INDEX IF NOT EXISTS orders_status_idx         ON orders (status);
CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS orders_magic_link_idx     ON orders (magic_link_token);

-- Trigger to keep updated_at fresh on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
