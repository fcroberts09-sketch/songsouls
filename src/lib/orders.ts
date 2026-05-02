/**
 * Order persistence. Writes incoming orders to a local JSON file
 * (./data/orders.json) so the admin dashboard can list them.
 *
 * For production, swap this for a real database (Postgres, Supabase, etc).
 * The file-based store is fine for v1 / single-instance deployments.
 */

import { promises as fs } from "fs";
import path from "path";
import type { Order } from "@/types/order";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

async function ensureDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

async function readAll(): Promise<Order[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(orders: Order[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

export async function saveOrder(order: Order): Promise<void> {
  const all = await readAll();
  all.unshift(order);
  await writeAll(all);
}

export async function listOrders(): Promise<Order[]> {
  return readAll();
}

export async function getOrder(id: string): Promise<Order | null> {
  const all = await readAll();
  return all.find((o) => o.id === id) ?? null;
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>
): Promise<Order | null> {
  const all = await readAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  await writeAll(all);
  return all[idx];
}

export function generateOrderId(): string {
  // Short, human-readable, sortable order IDs: SS-2025-XXXXXX
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SS-${year}-${random}`;
}
