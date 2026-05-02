/**
 * POST /api/checkout/create-session
 *
 * Creates a Stripe Checkout Session for an existing draft order.
 * Body: { orderId: string, tier: TierId }
 *
 * The orderId is set as `metadata.order_id` on the Session so the Phase 3
 * webhook can match Stripe events back to our order row.
 *
 * Stripe is called via REST so we don't need the SDK. STRIPE_SECRET_KEY
 * must be set (use a sk_test_… key during Phase 2 verification).
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeString } from "@/lib/validation";
import { getTier, type TierId } from "@/lib/pricing";
import { getOrderByNumber } from "@/lib/db";

const STRIPE_API = "https://api.stripe.com/v1";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

interface RequestBody {
  orderId?: unknown;
  tier?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`checkout-session:${ip}`, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many checkout attempts. Try again shortly." },
        { status: 429 }
      );
    }

    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const orderId = safeString(body.orderId, 50);
    const tierId = safeString(body.tier, 50) as TierId;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    const tier = getTier(tierId);
    if (!tier) {
      return NextResponse.json(
        { success: false, error: "Unknown tier" },
        { status: 400 }
      );
    }

    // Look up the draft order so we can attach customer_email and confirm
    // it exists. If Postgres isn't reachable yet (Phase 1 not run), fall
    // through and let Stripe collect the email itself.
    let customerEmail: string | undefined;
    let recipientName: string | undefined;
    try {
      const order = await getOrderByNumber(orderId);
      if (order) {
        customerEmail = order.customer_email;
        recipientName = order.recipient_name || undefined;
      }
    } catch (err) {
      console.warn("[checkout] could not look up order in DB:", err);
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe is not configured. Set STRIPE_SECRET_KEY.",
        },
        { status: 500 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `http://${request.headers.get("host") || "localhost:3000"}`;

    const params = new URLSearchParams();
    params.append("mode", "payment");
    if (customerEmail) params.append("customer_email", customerEmail);
    params.append(
      "success_url",
      `${siteUrl}/create?step=success&order=${encodeURIComponent(orderId)}`
    );
    params.append("cancel_url", `${siteUrl}/create?step=review&canceled=1`);

    // Use a pre-created Stripe Price if env var is set; otherwise inline price_data.
    const stripePriceId = tier.stripePriceEnvVar
      ? process.env[tier.stripePriceEnvVar]
      : undefined;

    if (stripePriceId) {
      params.append("line_items[0][price]", stripePriceId);
      params.append("line_items[0][quantity]", "1");
    } else {
      params.append("line_items[0][price_data][currency]", "usd");
      params.append("line_items[0][price_data][unit_amount]", String(tier.priceCents));
      params.append(
        "line_items[0][price_data][product_data][name]",
        tier.name
      );
      params.append(
        "line_items[0][price_data][product_data][description]",
        recipientName ? `A song for ${recipientName}` : tier.tagline
      );
      params.append("line_items[0][quantity]", "1");
    }

    // Webhook matching keys.
    params.append("metadata[order_id]", orderId);
    params.append("metadata[tier]", tier.id);
    params.append("client_reference_id", orderId);

    const stripeRes = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text().catch(() => "");
      console.error("[checkout/create-session] Stripe error", stripeRes.status, errBody);
      return NextResponse.json(
        { success: false, error: "Couldn't create checkout session. Please try again." },
        { status: 502 }
      );
    }

    const session: { id: string; url?: string } = await stripeRes.json();
    if (!session.url) {
      return NextResponse.json(
        { success: false, error: "Stripe didn't return a checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("[checkout/create-session] error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
