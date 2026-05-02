/**
 * Order notification emails — to ops + customer.
 * Uses Resend's REST API (no SDK needed). Falls back to console.log when
 * no key is set so the app stays functional in dev without setup.
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

function orderToOpsEmail(order: Order): string {
  const tier = getTier(order.tierId);
  const genre = getGenre(order.genreId);

  const answersHtml = order.answers
    .map(
      (a) => `
        <div style="margin: 16px 0; padding: 12px 16px; background: #f7f5ef; border-left: 3px solid #c98e26; border-radius: 4px;">
          <div style="font-size: 13px; font-weight: 600; color: #5c391d; margin-bottom: 6px;">${escapeHtml(a.question)}</div>
          <div style="font-size: 14px; color: #2a2057; white-space: pre-wrap;">${escapeHtml(a.answer)}</div>
        </div>`
    )
    .join("");

  const lyricsHtml = order.draftLyrics
    ? `
      <h3 style="margin-top: 32px; color: #15102e;">AI Draft: "${escapeHtml(order.draftLyrics.title)}"</h3>
      <p style="color: #5c391d; font-style: italic; font-size: 13px;">Suno prompt: ${escapeHtml(order.draftLyrics.suno_prompt)}</p>
      <pre style="font-family: Georgia, serif; font-size: 14px; line-height: 1.6; background: #f7f5ef; padding: 16px; border-radius: 6px; white-space: pre-wrap;">${escapeHtml(
        order.draftLyrics.structure
          .map(
            (s) =>
              `[${s.section.replace("_", " ").toUpperCase()}]\n${s.lines.join("\n")}`
          )
          .join("\n\n")
      )}</pre>`
    : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; color: #15102e;">
      <div style="background: linear-gradient(135deg, #1f1742 0%, #0d0820 100%); padding: 24px; border-radius: 8px 8px 0 0; color: #fbf6e8;">
        <div style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #e0a93f;">New Order</div>
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
        </table>

        <h3 style="margin-top: 32px; color: #15102e;">Customer's story</h3>
        ${answersHtml}

        ${order.customerNote ? `<h3 style="margin-top: 24px;">Note from customer</h3><p style="white-space: pre-wrap;">${escapeHtml(order.customerNote)}</p>` : ""}

        ${lyricsHtml}

        <p style="margin-top: 32px; font-size: 13px; color: #6d441e;">View this order in the admin dashboard: <a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "")}/admin">${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "")}/admin</a></p>
      </div>
    </div>`;
}

function orderToCustomerEmail(order: Order): string {
  const tier = getTier(order.tierId);
  const genre = getGenre(order.genreId);
  const turnaround = tier?.turnaround || "soon";

  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #15102e;">
      <div style="background: linear-gradient(135deg, #1f1742 0%, #0d0820 100%); padding: 32px 24px; border-radius: 8px; color: #fbf6e8; text-align: center;">
        <div style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #e0a93f;">SongSouls</div>
        <div style="font-size: 26px; font-weight: 400; margin-top: 12px; font-style: italic;">Your song is in our hands.</div>
      </div>

      <div style="padding: 32px 24px; line-height: 1.7; font-size: 15px;">
        <p>Hi ${escapeHtml(order.customerName.split(" ")[0] || "there")},</p>

        <p>Thank you for trusting us with this. We received your order for a ${escapeHtml(genre?.name || "song").toLowerCase()} song for <strong>${escapeHtml(order.recipientName)}</strong>, and we're already starting on it.</p>

        <p>Your order ID is <strong style="color: #a76d1d;">${escapeHtml(order.id)}</strong>. Hold on to this in case you need to reach us — and you can reach us anytime by replying to this email.</p>

        <p>You'll hear from us within <strong>${escapeHtml(turnaround)}</strong> with your finished song.</p>

        ${order.tierId === "keepsake" ? `<p>Because you chose <em>Keepsake</em>, you'll receive two song variations and a designed lyrics PDF. We'll have the first version to you within 48 hours.</p>` : ""}

        <p style="margin-top: 32px; font-style: italic; color: #5c391d;">Songs are how the people we love stay close. Thank you for letting us be part of yours.</p>

        <p style="margin-top: 24px;">— The SongSouls team</p>
      </div>
    </div>`;
}

export async function notifyNewOrder(order: Order): Promise<void> {
  const opsEmail = process.env.ORDER_NOTIFICATION_EMAIL || "hello@songsouls.ai";

  // Send both emails in parallel — failures are logged, not thrown
  await Promise.all([
    send({
      to: opsEmail,
      subject: `[SongSouls] ${order.id} · ${getTier(order.tierId)?.name || ""} · ${order.recipientName}`,
      html: orderToOpsEmail(order),
      replyTo: order.customerEmail,
    }),
    send({
      to: order.customerEmail,
      subject: `Your SongSouls order · ${order.id}`,
      html: orderToCustomerEmail(order),
      replyTo: opsEmail,
    }),
  ]);
}
