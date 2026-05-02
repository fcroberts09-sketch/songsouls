/**
 * POST /api/orders  (save-draft path only)
 *
 * Used when a customer chose "Just email me the draft" instead of paying.
 * Saves a free-tier order, fires the draft email, and returns the new
 * order id. No payment is involved.
 *
 * The paid flow lives in /api/checkout — orders are NOT created there
 * until Stripe has accepted the customer's card.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  isValidEmail,
  isValidPhotoDataUrl,
  safeString,
  sanitizeLyrics,
} from "@/lib/validation";
import { saveOrder, generateOrderId } from "@/lib/orders";
import { notifyDraftSaved } from "@/lib/email";
import { getGenre } from "@/lib/genres";
import { getTier } from "@/lib/pricing";
import type { Order, IntakeAnswer, UploadedPhoto } from "@/types/order";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

interface OrderRequestBody {
  mode?: unknown;
  genreId?: unknown;
  customerEmail?: unknown;
  customerName?: unknown;
  recipientName?: unknown;
  recipientRelationship?: unknown;
  occasion?: unknown;
  deliveryDate?: unknown;
  answers?: unknown;
  photos?: unknown;
  customerNote?: unknown;
  draftLyrics?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateResult = checkRateLimit(`orders:${ip}`, 10, 60_000);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many submissions. Try again shortly." },
        { status: 429 }
      );
    }

    let body: OrderRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // This endpoint is now save-draft only. Reject anything else so paid
    // orders can never accidentally be created without going through Stripe.
    const mode = safeString(body.mode, 50);
    if (mode !== "save-draft") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Paid orders must go through /api/checkout. This endpoint only saves free drafts.",
        },
        { status: 400 }
      );
    }

    const tier = getTier("preview");
    if (!tier) {
      return NextResponse.json(
        { success: false, error: "Preview tier missing" },
        { status: 500 }
      );
    }

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
        { success: false, error: "A valid email is required to save your draft." },
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

    const order: Order = {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      status: "received",
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
      console.error("[orders] persist failed:", err);
      // Continue anyway — we still want to email the draft.
    }

    try {
      await notifyDraftSaved(order);
    } catch (err) {
      console.error("[orders] draft email failed:", err);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      tier: { id: tier.id, name: tier.name, priceCents: tier.priceCents },
    });
  } catch (err) {
    console.error("[orders] error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
