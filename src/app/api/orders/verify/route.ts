/**
 * GET /api/orders/verify?session_id=cs_xxx
 *
 * Called by the client right after Stripe redirects back to the success
 * page. We:
 *  1. Hit Stripe to confirm the session is actually paid (don't trust the
 *     client to tell us so).
 *  2. Look up the matching order.
 *  3. Atomically promote it to "received" if the webhook hasn't yet — this
 *     keeps the success page snappy without relying on webhook latency.
 *  4. Send the customer + owner emails IF this call performed the transition
 *     (otherwise the webhook already did).
 *
 * Returns just enough info for the success page to render — no PII beyond
 * what the user already knows.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeString } from "@/lib/validation";
import {
  findOrderByStripeSession,
  getOrder,
  transitionToPaid,
} from "@/lib/orders";
import { notifyPaidOrder } from "@/lib/email";
import { getTier } from "@/lib/pricing";

const STRIPE_API = "https://api.stripe.com/v1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

interface StripeSession {
  id: string;
  payment_status?: string;
  payment_intent?: string;
  client_reference_id?: string;
  metadata?: Record<string, string> | null;
  amount_total?: number;
  customer_email?: string;
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`verify:${ip}`, 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many verification attempts." },
        { status: 429 }
      );
    }

    const sessionId = safeString(
      request.nextUrl.searchParams.get("session_id"),
      200
    );
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid session_id" },
        { status: 400 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { success: false, error: "Stripe is not configured." },
        { status: 503 }
      );
    }

    // 1. Confirm the session is paid, by asking Stripe directly.
    const stripeRes = await fetch(
      `${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    if (!stripeRes.ok) {
      const errBody = await stripeRes.text().catch(() => "");
      console.error("[verify] Stripe error", stripeRes.status, errBody);
      return NextResponse.json(
        { success: false, error: "Couldn't verify payment with Stripe." },
        { status: 502 }
      );
    }
    const session: StripeSession = await stripeRes.json();
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          paid: false,
          paymentStatus: session.payment_status || "unknown",
          error: "Payment hasn't been completed yet.",
        },
        { status: 402 }
      );
    }

    // 2. Find the matching order.
    const orderId =
      session.metadata?.order_id ||
      session.client_reference_id ||
      undefined;

    let order = orderId ? await getOrder(orderId) : null;
    if (!order) order = await findOrderByStripeSession(session.id);

    if (!order) {
      console.error(
        `[verify] paid session has no matching order. session=${session.id} order_id=${orderId}`
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment received but we couldn't find your order. We've been notified — please email support.",
        },
        { status: 500 }
      );
    }

    // 3. Atomically promote to received.
    const result = await transitionToPaid(order.id, {
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Order disappeared during verification." },
        { status: 500 }
      );
    }

    // 4. Fire emails if THIS call transitioned the order.
    if (result.transitioned) {
      try {
        await notifyPaidOrder(result.order);
      } catch (err) {
        console.error("[verify] paid-order email failed:", err);
      }
    }

    const tier = getTier(result.order.tierId);
    return NextResponse.json({
      success: true,
      paid: true,
      order: {
        id: result.order.id,
        tierId: result.order.tierId,
        tierName: tier?.name || result.order.tierId,
        turnaround: tier?.turnaround || "soon",
        amountCents: result.order.amountCents,
        customerEmail: result.order.customerEmail,
        recipientName: result.order.recipientName,
      },
    });
  } catch (err) {
    console.error("[verify] error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
