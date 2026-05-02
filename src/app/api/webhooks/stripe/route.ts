/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook handler. Configure in your Stripe dashboard to point at
 * `${NEXT_PUBLIC_SITE_URL}/api/webhooks/stripe` and listen for the
 * `checkout.session.completed` event. Set STRIPE_WEBHOOK_SECRET to the
 * signing secret Stripe gives you when you create the endpoint.
 *
 * On a successful checkout we:
 *  1. Verify the signature (HMAC-SHA256 of `${ts}.${body}` using the secret).
 *  2. Look up the order via metadata.order_id (or client_reference_id).
 *  3. Atomically transition the order from `pending_payment` → `received`,
 *     so emails are only sent once even if the verify endpoint races us.
 *  4. Send customer + owner notification emails.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { findOrderByStripeSession, getOrder, transitionToPaid } from "@/lib/orders";
import { notifyPaidOrder } from "@/lib/email";

// We need the raw body for signature verification — opting out of the
// implicit JSON parsing/edge runtime that Next would otherwise apply.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StripeCheckoutSession {
  id: string;
  client_reference_id?: string;
  payment_intent?: string;
  payment_status?: string;
  metadata?: Record<string, string> | null;
}

interface StripeEvent {
  id: string;
  type: string;
  data: { object: StripeCheckoutSession };
}

/**
 * Verify a Stripe webhook signature without pulling in the Stripe SDK.
 * https://stripe.com/docs/webhooks#verify-manually
 */
function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300
): { ok: boolean; error?: string } {
  if (!header) return { ok: false, error: "Missing signature header" };

  const parts = header.split(",").map((p) => p.trim());
  const tsPart = parts.find((p) => p.startsWith("t="));
  const v1Parts = parts.filter((p) => p.startsWith("v1="));
  if (!tsPart || v1Parts.length === 0) {
    return { ok: false, error: "Malformed signature header" };
  }

  const timestamp = parseInt(tsPart.slice(2), 10);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, error: "Invalid timestamp" };
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (ageSeconds > toleranceSeconds) {
    return { ok: false, error: "Timestamp outside tolerance window" };
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  // Stripe rotates secrets by sending multiple v1 signatures — accept any.
  const expectedBuf = Buffer.from(expected, "utf8");
  const matched = v1Parts.some((p) => {
    const sigHex = p.slice(3);
    const sigBuf = Buffer.from(sigHex, "utf8");
    return (
      sigBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(sigBuf, expectedBuf)
    );
  });

  return matched ? { ok: true } : { ok: false, error: "Signature mismatch" };
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // Read the body as text (raw) — required for signature verification.
  const raw = await request.text();

  // If we have a secret, the signature MUST verify. If we don't have a
  // secret configured, refuse — accepting unverified webhooks would be
  // a payment-bypass vulnerability.
  if (!secret) {
    console.error(
      "[webhook] STRIPE_WEBHOOK_SECRET not set — refusing webhook to avoid spoofing."
    );
    return NextResponse.json(
      { received: false, error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const sigHeader = request.headers.get("stripe-signature");
  const verification = verifyStripeSignature(raw, sigHeader, secret);
  if (!verification.ok) {
    console.error("[webhook] signature failed:", verification.error);
    return NextResponse.json(
      { received: false, error: verification.error },
      { status: 400 }
    );
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { received: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  // We only care about successful checkouts for now. Other events are
  // acknowledged so Stripe doesn't retry forever.
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object;

  // Best lookup is the order_id we set as metadata when creating the
  // session. Fall back to client_reference_id, then to a Firestore
  // lookup by sessionId, in case someone replayed an old session.
  const orderId =
    session.metadata?.order_id ||
    session.client_reference_id ||
    undefined;

  let order = orderId ? await getOrder(orderId) : null;
  if (!order) order = await findOrderByStripeSession(session.id);

  if (!order) {
    // Acknowledge so Stripe stops retrying, but log loudly — this means
    // a payment came in for an order we don't know about.
    console.error(
      `[webhook] received checkout.session.completed but no matching order. session=${session.id} order_id=${orderId}`
    );
    return NextResponse.json({
      received: true,
      warning: "No matching order — manual reconciliation needed.",
    });
  }

  if (session.payment_status !== "paid") {
    console.warn(
      `[webhook] checkout.session.completed but payment_status=${session.payment_status} for order ${order.id}`
    );
    return NextResponse.json({ received: true, ignored: "unpaid" });
  }

  const result = await transitionToPaid(order.id, {
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : undefined,
  });

  if (!result) {
    console.error(`[webhook] order vanished during transition: ${order.id}`);
    return NextResponse.json({
      received: true,
      warning: "Order disappeared during transition.",
    });
  }

  if (!result.transitioned) {
    // Verify endpoint already promoted the order — emails are already out.
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  try {
    await notifyPaidOrder(result.order);
  } catch (err) {
    // Don't fail the webhook — Stripe would retry and we'd promote again.
    console.error("[webhook] paid-order email failed:", err);
  }

  return NextResponse.json({ received: true, orderId: result.order.id });
}
