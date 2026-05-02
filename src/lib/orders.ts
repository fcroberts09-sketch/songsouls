/**
 * Order persistence.
 *
 * Two backends, picked at runtime:
 *  1. Firestore (when FIREBASE_PROJECT_ID etc are set)
 *  2. Local JSON file at ./data/orders.json (fallback for dev / single instance)
 *
 * Photos can blow past Firestore's 1MB doc limit, so when writing to Firestore
 * we strip the photos field and store each photo in an `orders/{id}/photos`
 * sub-collection. listOrders/getOrder reassemble the full Order before returning.
 */

import { promises as fs } from "fs";
import path from "path";
import type { Order, UploadedPhoto } from "@/types/order";
import { getDb } from "./firebase";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const COLLECTION = "orders";
const PHOTOS_SUB = "photos";

// ----- File backend -------------------------------------------------------

async function ensureDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

async function fileReadAll(): Promise<Order[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function fileWriteAll(orders: Order[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

async function fileSave(order: Order): Promise<void> {
  const all = await fileReadAll();
  const idx = all.findIndex((o) => o.id === order.id);
  if (idx >= 0) all[idx] = order;
  else all.unshift(order);
  await fileWriteAll(all);
}

/** Firestore rejects undefined values, so prune them before writing. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

// ----- Firestore helpers --------------------------------------------------

interface FirestoreLike {
  collection: (path: string) => any;
  runTransaction: <T>(fn: (tx: any) => Promise<T>) => Promise<T>;
}

async function firestoreSavePhotos(
  db: FirestoreLike,
  orderId: string,
  photos: UploadedPhoto[]
): Promise<void> {
  // Best-effort — photo writes are independent so a single failure doesn't
  // bring down the whole order.
  for (let i = 0; i < photos.length; i++) {
    try {
      await db
        .collection(COLLECTION)
        .doc(orderId)
        .collection(PHOTOS_SUB)
        .doc(`photo_${i}`)
        .set({ ...photos[i], idx: i });
    } catch (err) {
      console.error(`[orders] failed to save photo ${i} for ${orderId}:`, err);
    }
  }
}

async function firestoreLoadPhotos(
  db: FirestoreLike,
  orderId: string
): Promise<UploadedPhoto[]> {
  try {
    const snap = await db
      .collection(COLLECTION)
      .doc(orderId)
      .collection(PHOTOS_SUB)
      .get();
    const photos: UploadedPhoto[] = [];
    snap.docs
      .map((d: any) => d.data() as UploadedPhoto & { idx?: number })
      .sort((a: any, b: any) => (a.idx ?? 0) - (b.idx ?? 0))
      .forEach((p: any) => {
        const { idx: _idx, ...rest } = p;
        photos.push(rest as UploadedPhoto);
      });
    return photos;
  } catch (err) {
    console.error(`[orders] failed to load photos for ${orderId}:`, err);
    return [];
  }
}

// ----- Public API ---------------------------------------------------------

export async function saveOrder(order: Order): Promise<void> {
  const db = await getDb();
  if (db) {
    const { photos, ...rest } = order;
    const lite = stripUndefined({ ...rest, photos: [] as UploadedPhoto[] });
    try {
      await db.collection(COLLECTION).doc(order.id).set(lite);
      if (photos.length > 0) {
        await firestoreSavePhotos(db as unknown as FirestoreLike, order.id, photos);
      }
      return;
    } catch (err) {
      console.error("[orders] firestore save failed, falling back to file:", err);
      // Fall through to file save so we don't lose the order.
    }
  }
  await fileSave(order);
}

export async function listOrders(): Promise<Order[]> {
  const db = await getDb();
  if (db) {
    try {
      const snap = await db
        .collection(COLLECTION)
        .orderBy("createdAt", "desc")
        .limit(500)
        .get();
      const orders = snap.docs.map((d: any) => d.data() as Order);
      // Fetch photos in parallel — small cost on a low-volume admin page.
      await Promise.all(
        orders.map(async (o: Order) => {
          if (!o.photos || o.photos.length === 0) {
            o.photos = await firestoreLoadPhotos(
              db as unknown as FirestoreLike,
              o.id
            );
          }
        })
      );
      return orders;
    } catch (err) {
      console.error("[orders] firestore list failed, falling back to file:", err);
    }
  }
  return fileReadAll();
}

export async function getOrder(id: string): Promise<Order | null> {
  const db = await getDb();
  if (db) {
    try {
      const doc = await db.collection(COLLECTION).doc(id).get();
      if (!doc.exists) return null;
      const order = doc.data() as Order;
      if (!order.photos || order.photos.length === 0) {
        order.photos = await firestoreLoadPhotos(
          db as unknown as FirestoreLike,
          id
        );
      }
      return order;
    } catch (err) {
      console.error("[orders] firestore get failed, falling back to file:", err);
    }
  }
  const all = await fileReadAll();
  return all.find((o) => o.id === id) ?? null;
}

export async function findOrderByStripeSession(
  sessionId: string
): Promise<Order | null> {
  const db = await getDb();
  if (db) {
    try {
      const snap = await db
        .collection(COLLECTION)
        .where("stripeSessionId", "==", sessionId)
        .limit(1)
        .get();
      if (snap.empty) return null;
      const order = snap.docs[0].data() as Order;
      if (!order.photos || order.photos.length === 0) {
        order.photos = await firestoreLoadPhotos(
          db as unknown as FirestoreLike,
          order.id
        );
      }
      return order;
    } catch (err) {
      console.error(
        "[orders] firestore findByStripeSession failed, falling back to file:",
        err
      );
    }
  }
  const all = await fileReadAll();
  return all.find((o) => o.stripeSessionId === sessionId) ?? null;
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>
): Promise<Order | null> {
  const db = await getDb();
  if (db) {
    try {
      const ref = db.collection(COLLECTION).doc(id);
      const doc = await ref.get();
      if (!doc.exists) return null;
      // Strip photos from patch — they live in the sub-collection.
      const { photos: _photos, ...safePatch } = patch as any;
      await ref.update(stripUndefined(safePatch));
      const next = await ref.get();
      const order = next.data() as Order;
      order.photos = await firestoreLoadPhotos(
        db as unknown as FirestoreLike,
        id
      );
      return order;
    } catch (err) {
      console.error("[orders] firestore update failed, falling back to file:", err);
    }
  }
  const all = await fileReadAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  await fileWriteAll(all);
  return all[idx];
}

/**
 * Atomically transition an order from `pending_payment` to `received`.
 *
 * Used by the Stripe webhook AND the success-page verify endpoint, which
 * race each other after a successful checkout. Whichever runs first does
 * the work; the second sees `transitioned: false` and skips the side
 * effects (email send, status update).
 *
 * Returns the order at its final state, plus a flag indicating whether
 * THIS call performed the transition.
 */
export async function transitionToPaid(
  id: string,
  patch: { stripeSessionId?: string; stripePaymentIntentId?: string }
): Promise<{ order: Order; transitioned: boolean } | null> {
  const db = await getDb();
  if (db) {
    try {
      const ref = db.collection(COLLECTION).doc(id);
      return await db.runTransaction(async (tx: any) => {
        const doc = await tx.get(ref);
        if (!doc.exists) return null;
        const current = doc.data() as Order;
        if (current.status !== "pending_payment") {
          // Reload photos so callers can render the order.
          const photos = await firestoreLoadPhotos(
            db as unknown as FirestoreLike,
            id
          );
          return { order: { ...current, photos }, transitioned: false };
        }
        const updates = { ...patch, status: "received" as const };
        tx.update(ref, stripUndefined(updates));
        const photos = await firestoreLoadPhotos(
          db as unknown as FirestoreLike,
          id
        );
        return {
          order: { ...current, ...updates, photos },
          transitioned: true,
        };
      });
    } catch (err) {
      console.error("[orders] firestore transitionToPaid failed:", err);
      // Fall through to file path so we don't block the order.
    }
  }
  // File backend — small read/write race window, acceptable for v1.
  const all = await fileReadAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  if (all[idx].status !== "pending_payment") {
    return { order: all[idx], transitioned: false };
  }
  all[idx] = { ...all[idx], ...patch, status: "received" };
  await fileWriteAll(all);
  return { order: all[idx], transitioned: true };
}

export function generateOrderId(): string {
  // Short, human-readable, sortable order IDs: SS-2025-XXXXXX
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SS-${year}-${random}`;
}
