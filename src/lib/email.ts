/**
 * Order notification emails — to ops + customer.
 * Uses Resend's REST API (no SDK needed). Falls back to console.log when
 * no key is set so the app stays functional in dev without setup.
 *
 * Two flavors:
 *  - notifyPaidOrder(order): sent after Stripe payment is confirmed.
 *  - notifyDraftSaved(order): sent when a customer saves the free preview.
 *
 * Both are best-effort. Failures are logged, never thrown — emails must
 * never block a paid order from being recorded as paid.
 */

import type { Order } from "@/types/order";
import { getTier } from "./pricing";
import { getGenre } from "./genres";

const RESEND_URL = "https://api.resend.com/emails";

interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

async function send(args: SendEmailArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL || "orders@songsouls.ai";

  if (!apiKey) {
    console.log("[email] No RESEND_API_KEY — would have sent:");
    console.log(`  To: ${Array.isArray(args.to) ? args.to.join(", ") : args.to}`);
    console.log(`  Subject: ${args.subject}`);
    console.log(`  Body:\n${args.html.slice(0, 500)}…`);
    return { ok: true };
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `SongSouls <${from}>`,
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
        reply_to: args.replyTo,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown error");
      console.error("[email] Resend error:", res.status, errText);
      return { ok: false, error: errText };
    }

    return { ok: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false, error: String(err) };
  }
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function ownerEmailAddress(): string {
  // OWNER_EMAIL is the new canonical name; ORDER_NOTIFICATION_EMAIL kept for
  // backward compat with existing deployments.
  return (
    process.env.OWNER_EMAIL ||
    process.env.ORDER_NOTIFICATION_EMAIL ||
    "hello@songsouls.ai"
  );
}

function answersHtml(order: Order): string {
  return order.answers
    .map(
      (a) => `
        <div style="margin: 16px 0; padding: 12px 16px; background: #f7f5ef; border-left: 3px solid #c98e26; border-radius: 4px;">
          <div style="font-size: 13px; font-weight: 600; color: #5c391d; margin-bottom: 6px;">${escapeHtml(a.question)}</div>
          <div style="font-size: 14px; color: #2a2057; white-space: pre-wrap;">${escapeHtml(a.answer)}</div>
        </div>`
    )
    .join("");
}

function lyricsHtml(order: Order): string {
  if (!order.draftLyrics) return "";
  return `
      <h3 style="margin-top: 32px; color: #15102e;">AI Draft: "${escapeHtml(order.draftLyrics.title)}"</h3>
      <p style="color: #5c391d; font-style: italic; font-size: 13px;">Suno prompt: ${escapeHtml(order.draftLyrics.suno_prompt)}</p>
      <pre style="font-family: Georgia, serif; font-size: 14px; line-height: 1.6; background: #f7f5ef; padding: 16px; border-radius: 6px; white-space: pre-wrap;">${escapeHtml(
        order.draftLyrics.structure
          .map(
            (s) =>
              `[${s.section.replace("_", " ").toUpperCase()}]\n${s.lines.join("\n")}`
          )
          .join("\n\n")
      )}</pre>`;
}

function ownerOrderEmail(order: Order, banner: string): string {
  const tier = getTier(order.tierId);
  const genre = getGenre(order.genreId);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; color: #15102e;">
      <div style="background: linear-gradient(135deg, #1f1742 0%, #0d0820 100%); padding: 24px; border-radius: 8px 8px 0 0; color: #fbf6e8;">
        <div style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #e0a93f;">${escapeHtml(banner)}</div>
        <div style="font-size: 22px; font-weight: 600; margin-top: 6px;">${escapeHtml(order.id)}</div>
        <div style="font-size: 14px; margin-top: 4px; opacity: 0.8;">${escapeHtml(tier?.name || order.tierId)} · $${(order.amountCents / 100).toFixed(0)}</div>
      </div>

      <div style="padding: 24px; background: #fefcf7; border: 1px solid #ebdbac; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; font-size: 14px; line-height: 1.7;">
          <tr><td style="color: #6d441e; width: 140px;">Customer</td><td><strong>${escapeHtml(order.customerName)}</strong> &lt;${escapeHtml(order.customerEmail)}&gt;</td></tr>
          <tr><td style="color: #6d441e;">Genre</td><td>${escapeHtml(genre?.name || order.genreId)}</td></tr>
          <tr><td style="color: #6d441e;">Recipient</td><td><strong>${escapeHtml(order.recipientName)}</strong> (${escapeHtml(order.recipientRelationship)})</td></tr>
          ${order.occasion ? `<tr><td style="color: #6d441e;">Occasion</td><td>${escapeHtml(order.occasion)}</td></tr>` : ""}
          ${order.deliveryDate ? `<tr><td style="color: #6d441e;">Needed By</td><td>${escapeHtml(order.deliveryDate)}</td></tr>` : ""}
          <tr><td style="color: #6d441e;">Photos</td><td>${order.photos.length} attached</td></tr>
          ${order.stripeSessionId ? `<tr><td style="color: #6d441e;">Stripe</td><td style="font-family: monospace; font-size: 12px;">${escapeHtml(order.stripeSessionId)}</td></tr>` : ""}
        </table>

        <h3 style="margin-top: 32px; color: #15102e;">Customer's story</h3>
        ${answersHtml(order)}

        ${order.customerNote ? `<h3 style="margin-top: 24px;">Note from customer</h3><p style="white-space: pre-wrap;">${escapeHtml(order.customerNote)}</p>` : ""}

        ${lyricsHtml(order)}

        <p style="margin-top: 32px; font-size: 13px; color: #6d441e;">View this order in the admin dashboard: <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "")}/admin">${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "")}/admin</a></p>
      </div>
    </div>`;
}

function customerPaidEmail(order: Order): string {
  const tier = getTier(order.tierId);
  const genre = getGenre(order.genreId);
  const turnaround = tier?.turnaround || "soon";

  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #15102e;">
      <div style="background: linear-gradient(135deg, #1f1742 0%, #0d0820 100%); padding: 32px 24px; border-radius: 8px; color: #fbf6e8; text-align: center;">
        <div style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #e0a93f;">SongSouls · Payment received</div>
        <div style="font-size: 26px; font-weight: 400; margin-top: 12px; font-style: italic;">Your song is in our hands.</div>
      </div>

      <div style="padding: 32px 24px; line-height: 1.7; font-size: 15px;">
        <p>Hi ${escapeHtml(order.customerName.split(" ")[0] || "there")},</p>

        <p>Thank you — your payment of <strong>$${(order.amountCents / 100).toFixed(0)}</strong> for the <strong>${escapeHtml(tier?.name || order.tierId)}</strong> has been received. We're already starting on your ${escapeHtml(genre?.name || "song").toLowerCase()} song for <strong>${escapeHtml(order.recipientName)}</strong>.</p>

        <p>Your order ID is <strong style="color: #a76d1d;">${escapeHtml(order.id)}</strong>. Hold on to this — and you can reach us anytime by replying to this email.</p>

        <p>You'll hear from us within <strong>${escapeHtml(turnaround)}</strong> with your finished song.</p>

        ${order.tierId === "life-album" ? `<p>Because you chose our <em>Life Album</em>, we'll be in touch within 48 hours to schedule your 1-on-1 consultation. The album takes shape from that conversation.</p>` : ""}

        <p style="margin-top: 32px; font-style: italic; color: #5c391d;">Songs are how the people we love stay close. Thank you for letting us be part of yours.</p>

        <p style="margin-top: 24px;">— The SongSouls team</p>
      </div>
    </div>`;
}

function customerDraftEmail(order: Order): string {
  const lyrics = order.draftLyrics
    ? `
      <div style="margin-top: 28px; padding: 20px; background: #f7f5ef; border-radius: 8px;">
        <div style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #a76d1d;">Your draft</div>
        <div style="font-size: 20px; font-weight: 400; margin: 8px 0 16px; color: #15102e; font-style: italic;">"${escapeHtml(order.draftLyrics.title)}"</div>
        <pre style="font-family: Georgia, serif; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #2a2057; margin: 0;">${escapeHtml(
          order.draftLyrics.structure
            .map(
              (s) =>
                `[${s.section.replace("_", " ").toUpperCase()}]\n${s.lines.join("\n")}`
            )
            .join("\n\n")
        )}</pre>
      </div>`
    : "";

  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #15102e;">
      <div style="background: linear-gradient(135deg, #1f1742 0%, #0d0820 100%); padding: 32px 24px; border-radius: 8px; color: #fbf6e8; text-align: center;">
        <div style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #e0a93f;">SongSouls · Draft saved</div>
        <div style="font-size: 26px; font-weight: 400; margin-top: 12px; font-style: italic;">Your draft is yours to keep.</div>
      </div>

      <div style="padding: 32px 24px; line-height: 1.7; font-size: 15px;">
        <p>Hi ${escapeHtml(order.customerName.split(" ")[0] || "there")},</p>

        <p>We've saved your draft for <strong>${escapeHtml(order.recipientName)}</strong>. Your draft ID is <strong style="color: #a76d1d;">${escapeHtml(order.id)}</strong>.</p>

        <p style="background: #fef7e6; border-left: 3px solid #c98e26; padding: 12px 16px; border-radius: 4px;">
          <strong>You haven't been charged.</strong> When you're ready to bring this to life as a finished song, head back to <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "https://songsouls.ai")}/create" style="color: #a76d1d;">songsouls.ai/create</a> and complete checkout.
        </p>

        ${lyrics}

        <p style="margin-top: 32px; font-style: italic; color: #5c391d;">Take your time. The draft will be here when you come back.</p>

        <p style="margin-top: 24px;">— The SongSouls team</p>
      </div>
    </div>`;
}

/**
 * Sent after Stripe confirms payment. Goes to both customer + owner.
 * Idempotency is enforced UPSTREAM via transitionToPaid — by the time
 * this is called, the order has already moved out of pending_payment.
 */
export async function notifyPaidOrder(order: Order): Promise<void> {
  const owner = ownerEmailAddress();
  const tier = getTier(order.tierId);

  await Promise.all([
    send({
      to: owner,
      subject: `[SongSouls] PAID · ${order.id} · ${tier?.name || ""} · ${order.recipientName}`,
      html: ownerOrderEmail(order, "New paid order"),
      replyTo: order.customerEmail,
    }),
    send({
      to: order.customerEmail,
      subject: `Your SongSouls order is confirmed · ${order.id}`,
      html: customerPaidEmail(order),
      replyTo: owner,
    }),
  ]);
}

/**
 * Sent when a customer chose "just email me the draft" instead of paying.
 * Customer email makes it crystal clear they have NOT been charged.
 */
export async function notifyDraftSaved(order: Order): Promise<void> {
  const owner = ownerEmailAddress();

  await Promise.all([
    send({
      to: owner,
      subject: `[SongSouls] DRAFT lead · ${order.id} · ${order.recipientName}`,
      html: ownerOrderEmail(order, "Draft saved (no payment)"),
      replyTo: order.customerEmail,
    }),
    send({
      to: order.customerEmail,
      subject: `Your SongSouls draft is saved · ${order.id}`,
      html: customerDraftEmail(order),
      replyTo: owner,
    }),
  ]);
}
