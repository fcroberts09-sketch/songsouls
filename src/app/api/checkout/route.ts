/**
 * POST /api/checkout
 *
 * The single entry point to a *paid* order:
 *  1. Validate the entire order payload (tier, genre, customer, recipient, etc).
 *  2. Persist the order with status = "pending_payment".
 *  3. Create a Stripe Checkout Session that references the order via
 *     client_reference_id + metadata.order_id.
 *  4. Return the hosted-checkout URL — the client redirects the user to it.
 *
 * Emails are NOT sent here. They're triggered after payment confirmation by
 * /api/webhooks/stripe (or the success-page verify endpoint as a fallback).
 *
 * If Stripe isn't configured, this route refuses to create a paid order —
 * it would be a payment-bypass bug to do otherwise.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  isValidEmail,
  isValidPhotoDataUrl,
  safeString,
  sanitizeLyrics,
} from "@/lib/validation";
import { saveOrder, generateOrderId, updateOrder } from "@/lib/orders";
import { getGenre } from "@/lib/genres";
import { getTier } from "@/lib/pricing";
import type { Order, IntakeAnswer, UploadedPhoto } from "@/types/order";

const STRIPE_API = "https://api.stripe.com/v1";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

interface CheckoutBody {
  tierId?: unknown;
  genreId?: unknown;
  customerEmail?: unknown;
  customerName?: unknown;
  recipientName?: unknown;
  recipientRelationship?: unknown;
  occasion?: unknown;
  deliveryDate?: unknown;
  customerNote?: unknown;
  answers?: unknown;
  photos?: unknown;
  draftLyrics?: unknown;
}

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

    // ----- Validate tier -------------------------------------------------
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
        {
          success: false,
          error: "The free preview tier doesn't go through checkout.",
        },
        { status: 400 }
      );
    }

    // ----- Validate Stripe is configured ---------------------------------
    // Refuse to create the order at all if we can't take payment — otherwise
    // we'd leave a half-paid order in the DB with no way to recover.
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payments are temporarily unavailable. Please try again shortly or email us.",
        },
        { status: 503 }
      );
    }

    // ----- Validate the rest of the order --------------------------------
    const genreId = safeString(body.genreId, 50);
    const genre = getGenre(genreId);
    if (!genre) {
      return NextResponse.json(
        { success: false, error: "Unknown genre" },
        { status: 400 }
      );
    }

    const customerEmail = safeString(body.customerEmail, 254);
    if (!isValidEmail(customerEmail)) {
      return NextResponse.json(
        { success: false, error: "A valid email is required for checkout." },
        { status: 400 }
      );
    }
    const customerName = safeString(body.customerName, 100) || "Friend";

    const recipientName = safeString(body.recipientName, 80);
    const recipientRelationship = safeString(body.recipientRelationship, 80);
    if (!recipientName) {
      return NextResponse.json(
        { success: false, error: "Tell us who this song is for." },
        { status: 400 }
      );
    }

    const occasion = safeString(body.occasion, 200);
    const deliveryDate = safeString(body.deliveryDate, 50);
    const customerNote = safeString(body.customerNote, 1000);

    const rawAnswers = Array.isArray(body.answers) ? body.answers : [];
    const answers: IntakeAnswer[] = rawAnswers
      .slice(0, 20)
      .map((a: unknown) => {
        const obj = (a || {}) as Record<string, unknown>;
        return {
          questionId: safeString(obj.questionId, 80),
          question: safeString(obj.question, 300),
          answer: safeString(obj.answer, 3000),
        };
      })
      .filter((a) => a.questionId && a.answer);

    const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
    const photos: UploadedPhoto[] = [];
    for (const raw of rawPhotos.slice(0, 3)) {
      const obj = (raw || {}) as Record<string, unknown>;
      const src = safeString(obj.src, 8_000_000);
      if (!isValidPhotoDataUrl(src)) continue;
      photos.push({
        src,
        caption: safeString(obj.caption, 200) || undefined,
        filename: safeString(obj.filename, 200) || undefined,
      });
    }

    const draftLyrics = sanitizeLyrics(body.draftLyrics) || undefined;

    // ----- Persist the pending order ------------------------------------
    const order: Order = {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      status: "pending_payment",
      tierId: tier.id,
      amountCents: tier.priceCents,
      customerEmail,
      customerName,
      genreId: genre.id,
      recipientName,
      recipientRelationship,
      occasion: occasion || undefined,
      deliveryDate: deliveryDate || undefined,
      answers,
      photos,
      customerNote: customerNote || undefined,
      draftLyrics,
    };

    try {
      await saveOrder(order);
    } catch (err) {
      console.error("[checkout] persist failed:", err);
      return NextResponse.json(
        { success: false, error: "Couldn't save your order. Please try again." },
        { status: 500 }
      );
    }

    // ----- Create the Stripe Checkout Session ---------------------------
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `http://${request.headers.get("host") || "localhost:3000"}`;

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("customer_email", customerEmail);
    // {CHECKOUT_SESSION_ID} is a Stripe placeholder substituted at redirect.
    params.append(
      "success_url",
      `${siteUrl}/create?step=success&session_id={CHECKOUT_SESSION_ID}`
    );
    params.append("cancel_url", `${siteUrl}/create?step=checkout&canceled=1`);

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

    params.append("metadata[order_id]", order.id);
    params.append("client_reference_id", order.id);
    params.append("payment_intent_data[metadata][order_id]", order.id);

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

    // Stash the session id on the order for cross-referencing later (webhook,
    // verify endpoint, admin dashboard).
    try {
      await updateOrder(order.id, { stripeSessionId: session.id });
    } catch (err) {
      // Non-fatal — the webhook can still find the order via metadata.order_id.
      console.error("[checkout] failed to attach sessionId to order:", err);
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      orderId: order.id,
    });
  } catch (err) {
    console.error("[checkout] error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
