/**
 * Typed Postgres helpers for the orders table.
 *
 * Uses @neondatabase/serverless (the official driver for Vercel Postgres,
 * which is now Neon-backed). Reads DATABASE_URL from the environment — set
 * automatically when you connect a Neon database via the Vercel marketplace,
 * or pulled locally via `vercel env pull .env.local`.
 */

import { neon, Pool, type NeonQueryFunction } from "@neondatabase/serverless";

function connectionString(): string {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Connect a Vercel Postgres (Neon) database to the project, or run `vercel env pull .env.local` for local dev."
    );
  }
  return url;
}

// Lazy singletons so importing this module at build time (when env vars may
// not be present) doesn't crash. Connections are only opened on first query.
let _sql: NeonQueryFunction<false, false> | null = null;
let _pool: Pool | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) _sql = neon(connectionString());
  return _sql;
}

function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: connectionString() });
  return _pool;
}

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "in_production"
  | "qc_review"
  | "ready"
  | "delivered"
  | "refunded";

export interface OrderRow {
  id: string;
  order_number: string;
  customer_email: string;
  status: OrderStatus;
  lyrics_json: unknown | null;
  genre: string | null;
  recipient_name: string | null;
  occasion: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  price_cents: number;
  currency: string;
  song_file_url: string | null;
  lyrics_pdf_url: string | null;
  magic_link_token: string | null;
  magic_link_expires_at: Date | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrderInput {
  customerEmail: string;
  priceCents: number;
  status?: OrderStatus;
  genre?: string | null;
  recipientName?: string | null;
  occasion?: string | null;
  currency?: string;
  lyricsJson?: unknown;
}

const UPDATABLE_COLUMNS = [
  "status",
  "lyrics_json",
  "genre",
  "recipient_name",
  "occasion",
  "stripe_session_id",
  "stripe_payment_intent_id",
  "price_cents",
  "currency",
  "song_file_url",
  "lyrics_pdf_url",
  "magic_link_token",
  "magic_link_expires_at",
  "delivered_at",
] as const;

export type UpdatableOrderColumn = (typeof UPDATABLE_COLUMNS)[number];
export type UpdateOrderPatch = Partial<Pick<OrderRow, UpdatableOrderColumn>>;

/** SS-YYYY-XXXXXX — matches the CHECK constraint in the migration. */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SS-${year}-${random}`;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderRow> {
  const lyricsParam =
    input.lyricsJson === undefined ? null : JSON.stringify(input.lyricsJson);

  // Tiny retry loop in case the random order_number collides (vanishingly rare).
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = generateOrderNumber();
    try {
      const rows = (await getSql()`
        INSERT INTO orders (
          order_number,
          customer_email,
          status,
          genre,
          recipient_name,
          occasion,
          price_cents,
          currency,
          lyrics_json
        ) VALUES (
          ${orderNumber},
          ${input.customerEmail},
          ${input.status ?? "draft"},
          ${input.genre ?? null},
          ${input.recipientName ?? null},
          ${input.occasion ?? null},
          ${input.priceCents},
          ${input.currency ?? "usd"},
          ${lyricsParam}::jsonb
        )
        RETURNING *
      `) as OrderRow[];
      return rows[0];
    } catch (err) {
      const e = err as { code?: string; constraint?: string };
      if (e.code === "23505" && e.constraint === "orders_order_number_key") {
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to generate a unique order_number after 5 attempts");
}

export async function getOrderById(id: string): Promise<OrderRow | null> {
  const rows = (await getSql()`
    SELECT * FROM orders WHERE id = ${id} LIMIT 1
  `) as OrderRow[];
  return rows[0] ?? null;
}

export async function getOrderByNumber(
  orderNumber: string
): Promise<OrderRow | null> {
  const rows = (await getSql()`
    SELECT * FROM orders WHERE order_number = ${orderNumber} LIMIT 1
  `) as OrderRow[];
  return rows[0] ?? null;
}

export async function getOrderByStripeSession(
  sessionId: string
): Promise<OrderRow | null> {
  const rows = (await getSql()`
    SELECT * FROM orders WHERE stripe_session_id = ${sessionId} LIMIT 1
  `) as OrderRow[];
  return rows[0] ?? null;
}

/** Returns the order only if the magic link is non-null and not yet expired. */
export async function getOrderByMagicLink(
  token: string
): Promise<OrderRow | null> {
  const rows = (await getSql()`
    SELECT * FROM orders
    WHERE magic_link_token = ${token}
      AND magic_link_expires_at IS NOT NULL
      AND magic_link_expires_at > now()
    LIMIT 1
  `) as OrderRow[];
  return rows[0] ?? null;
}

export async function listOrdersByEmail(email: string): Promise<OrderRow[]> {
  const rows = (await getSql()`
    SELECT * FROM orders
    WHERE customer_email = ${email}
    ORDER BY created_at DESC
  `) as OrderRow[];
  return rows;
}

export async function updateOrder(
  id: string,
  patch: UpdateOrderPatch
): Promise<OrderRow | null> {
  const entries = Object.entries(patch).filter(
    ([k, v]) =>
      UPDATABLE_COLUMNS.includes(k as UpdatableOrderColumn) && v !== undefined
  );
  if (entries.length === 0) return getOrderById(id);

  // Column names come from the hardcoded UPDATABLE_COLUMNS whitelist, not user
  // input — safe to interpolate. Values stay parameterized.
  const setClause = entries
    .map(([col], i) => {
      if (col === "lyrics_json") return `${col} = $${i + 2}::jsonb`;
      return `${col} = $${i + 2}`;
    })
    .join(", ");

  const values = entries.map(([col, v]) =>
    col === "lyrics_json" && v !== null ? JSON.stringify(v) : v
  );

  const { rows } = await getPool().query<OrderRow>(
    `UPDATE orders SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0] ?? null;
}
