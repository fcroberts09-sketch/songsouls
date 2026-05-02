import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  isValidEmail,
  isValidPhotoDataUrl,
  safeString,
} from "@/lib/validation";
import { saveOrder, updateOrder, generateOrderId } from "@/lib/orders";
import { notifyNewOrder } from "@/lib/email";
import { getGenre } from "@/lib/genres";
import { getTier } from "@/lib/pricing";
import { generateLyrics } from "@/lib/lyrics";
import type { Order, IntakeAnswer, UploadedPhoto } from "@/types/order";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

interface OrderRequestBody {
  tierId?: unknown;
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

    // Validate tier
    const tierId = safeString(body.tierId, 50);
    const tier = getTier(tierId as never);
    if (!tier) {
      return NextResponse.json(
        { success: false, error: "Unknown tier" },
        { status: 400 }
      );
    }

    // Validate genre
    const genreId = safeString(body.genreId, 50);
    const genre = getGenre(genreId);
    if (!genre) {
      return NextResponse.json(
        { success: false, error: "Unknown genre" },
        { status: 400 }
      );
    }

    // Validate customer
    const customerEmail = safeString(body.customerEmail, 254);
    if (!isValidEmail(customerEmail)) {
      return NextResponse.json(
        { success: false, error: "A valid email is required so we can send you the song." },
        { status: 400 }
      );
    }
    const customerName = safeString(body.customerName, 100) || "Friend";

    // Validate recipient
    const recipientName = safeString(body.recipientName, 80);
    const recipientRelationship = safeString(body.recipientRelationship, 80);
    if (!recipientName) {
      return NextResponse.json(
        { success: false, error: "Tell us who this song is for." },
        { status: 400 }
      );
    }

    // Optional fields
    const occasion = safeString(body.occasion, 200);
    const deliveryDate = safeString(body.deliveryDate, 50);
    const customerNote = safeString(body.customerNote, 1000);

    // Answers
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

    // Photos — accept up to 3, max ~6MB each
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

    const order: Order = {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      status: tier.id === "preview" ? "received" : "pending_payment",
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
    };

    // Persist (best-effort — file system may be read-only on some hosts)
    try {
      await saveOrder(order);
    } catch (err) {
      console.error("[orders] persist failed:", err);
      // Continue anyway — email is the source of truth
    }

    // Send notification emails (best-effort — failures don't block the customer)
    try {
      await notifyNewOrder(order);
    } catch (err) {
      console.error("[orders] notification failed:", err);
    }

    // Generate the AI draft in the background. The customer never sees it —
    // it's a starter for the songwriter to refine. Fire-and-forget so the
    // checkout response isn't held up; persist the draft when it completes.
    void (async () => {
      try {
        const draft = await generateLyrics({
          genreId: genre.id,
          recipientName,
          recipientRelationship,
          occasion: occasion || undefined,
          answers,
        });
        if (draft) {
          await updateOrder(order.id, { draftLyrics: draft });
        }
      } catch (err) {
        console.error("[orders] background lyrics generation failed:", err);
      }
    })();

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
