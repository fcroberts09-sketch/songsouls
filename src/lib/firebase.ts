/**
 * Firebase Admin (Firestore) initialization.
 *
 * Requires three env vars to be set together:
 *  - FIREBASE_PROJECT_ID
 *  - FIREBASE_CLIENT_EMAIL
 *  - FIREBASE_PRIVATE_KEY (the literal contents — newlines may be escaped as \n)
 *
 * If any are missing, getDb() returns null and callers fall back to the
 * file-based store. Initialization is lazy and cached so route handlers
 * don't pay the cost on every request.
 */

import type { Firestore } from "firebase-admin/firestore";

let cached: Firestore | null | undefined;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

export async function getDb(): Promise<Firestore | null> {
  if (cached !== undefined) return cached;

  if (!isFirebaseConfigured()) {
    cached = null;
    return null;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");

  try {
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert({ projectId, clientEmail, privateKey }),
          });

    cached = getFirestore(app);
    return cached;
  } catch (err) {
    console.error("[firebase] init failed:", err);
    cached = null;
    return null;
  }
}
