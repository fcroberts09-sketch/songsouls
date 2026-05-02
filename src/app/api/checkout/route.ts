import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeString, isValidEmail } from "@/lib/validation";
import { getTier } from "@/lib/pricing";

const STRIPE_API = "https://api.stripe.com/v1";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

interface CheckoutBody {
  tierId?: unknown;
  orderId?: unknown;
  customerEmail?: unknown;
  recipientName?: unknown;
}

/**
 * Create a Stripe Checkout Session and return the redirect URL.
 * If Stripe is not configured, returns a graceful fallback that the
 * client can use to skip checkout (treat the order as a lead instead).
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`checkout:${ip}`, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many checkout attempts. Try again shortly." },
        { status: 429 }
      );
    }

    let body: CheckoutBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const tierId = safeString(body.tierId, 50);
    const tier = getTier(tierId as never);
    if (!tier) {
      return NextResponse.json(
        { success: false, error: "Unknown tier" },
        { status: 400 }
      );
    }

    if (tier.priceCents === 0) {
      return NextResponse.json(
        { success: false, error: "Free tier doesn't require checkout." },
        { status: 400 }
      );
    }

    const orderId = safeString(body.orderId, 50);
    const customerEmail = safeString(body.customerEmail, 254);
    const recipientName = safeString(body.recipientName, 80);

    if (!isValidEmail(customerEmail)) {
      return NextResponse.json(
        { success: false, error: "A valid email is required for checkout." },
        { status: 400 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://${request.headers.get("host") || "localhost:3000"}`;

    // Graceful fallback: no Stripe configured → tell client to skip checkout
    if (!stripeKey) {
      return NextResponse.json({
        success: true,
        mode: "no-stripe",
        message:
          "Stripe is not configured — the order has been logged as a lead. Reach out to the customer manually with a payment link.",
      });
    }

    // Build Stripe Checkout Session via REST (no SDK needed)
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("customer_email", customerEmail);
    params.append("success_url", `${siteUrl}/create?step=success&order=${encodeURIComponent(orderId)}`);
    params.append("cancel_url", `${siteUrl}/create?step=checkout&canceled=1`);

    // Use predefined Stripe price if env var is set, else inline price_data
    const stripePriceId = tier.stripePriceEnvVar
      ? process.env[tier.stripePriceEnvVar]
      : undefined;

    if (stripePriceId) {
      params.append("line_items[0][price]", stripePriceId);
      params.append("line_items[0][quantity]", "1");
    } else {
      params.append("line_items[0][price_data][currency]", "usd");
      params.append("line_items[0][price_data][unit_amount]", String(tier.priceCents));
      params.append("line_items[0][price_data][product_data][name]", `SongSouls — ${tier.name}`);
      params.append(
        "line_items[0][price_data][product_data][description]",
        recipientName ? `A song for ${recipientName}` : tier.tagline
      );
      params.append("line_items[0][quantity]", "1");
    }

    if (orderId) {
      params.append("metadata[order_id]", orderId);
      params.append("client_reference_id", orderId);
    }

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
      console.error("[checkout] Stripe error", stripeRes.status, errBody);
      return NextResponse.json(
        {
          success: false,
          error: "Couldn't create checkout session. Please try again.",
        },
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
      mode: "stripe",
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("[checkout] error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
