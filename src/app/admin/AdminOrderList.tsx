"use client";

import { useState } from "react";
import type { Order } from "@/types/order";
import { formatSectionLabel } from "@/lib/validation";

type EnrichedOrder = Order & { tierName: string; genreName: string };

interface AdminOrderListProps {
  orders: EnrichedOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  received: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  drafting: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  in_review: "bg-gold-500/15 text-gold-300 border-gold-500/30",
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  refunded: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function AdminOrderList({ orders }: AdminOrderListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (orders.length === 0) {
    return (
      <div className="card-deep rounded-2xl p-12 text-center text-cream-200/55">
        <p className="text-lg mb-2">No orders yet.</p>
        <p className="text-sm">When customers submit, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending_payment", "received", "drafting", "in_review", "delivered"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-widest border transition-colors ${
              filter === s
                ? "bg-gold-400/20 border-gold-400/40 text-gold-200"
                : "bg-ink-900/40 border-cream-100/10 text-cream-200/60 hover:border-cream-100/25"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((order) => {
          const isOpen = expanded === order.id;
          return (
            <div key={order.id} className="card-deep rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="w-full text-left p-5 hover:bg-ink-800/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 min-w-0">
                    <div>
                      <div className="font-mono text-xs text-gold-300 mb-1">{order.id}</div>
                      <div className="font-display text-lg text-cream-100">
                        {order.recipientName}
                        <span className="text-cream-200/50 text-sm ml-2">
                          · {order.genreName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-cream-200/60">
                      {order.customerName} &lt;{order.customerEmail}&gt;
                    </span>
                    <span className="text-cream-100 font-medium">${(order.amountCents / 100).toFixed(0)}</span>
                    <span className="text-cream-200/50 text-xs">{order.tierName}</span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest border ${
                        STATUS_COLORS[order.status] || "bg-ink-800 text-cream-200/60 border-cream-100/10"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                    <svg
                      className={`w-4 h-4 text-cream-200/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-cream-100/10 p-6 space-y-6 bg-ink-950/40">
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <Field label="Customer">
                      {order.customerName} &lt;<a href={`mailto:${order.customerEmail}`} className="text-gold-300 hover:underline">{order.customerEmail}</a>&gt;
                    </Field>
                    <Field label="Created">
                      {new Date(order.createdAt).toLocaleString()}
                    </Field>
                    <Field label="Recipient">
                      {order.recipientName} ({order.recipientRelationship})
                    </Field>
                    {order.occasion && <Field label="Occasion">{order.occasion}</Field>}
                    {order.deliveryDate && <Field label="Needed by">{order.deliveryDate}</Field>}
                    <Field label="Photos">{order.photos.length} attached</Field>
                  </div>

                  {order.customerNote && (
                    <Field label="Customer note">
                      <p className="whitespace-pre-wrap">{order.customerNote}</p>
                    </Field>
                  )}

                  {/* Answers */}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-gold-400/70 mb-3">
                      Story
                    </div>
                    <div className="space-y-3">
                      {order.answers.map((a, i) => (
                        <div key={i} className="bg-ink-900/60 rounded-lg p-4 border-l-2 border-gold-500/40">
                          <div className="text-xs text-cream-200/60 mb-1">{a.question}</div>
                          <div className="text-sm text-cream-100 whitespace-pre-wrap">{a.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photos */}
                  {order.photos.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-gold-400/70 mb-3">
                        Photos
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {order.photos.map((p, i) => (
                          <div key={i} className="bg-ink-900/60 rounded-lg overflow-hidden">
                            <img src={p.src} alt="" className="w-full aspect-video object-cover" />
                            {p.caption && (
                              <div className="p-2 text-xs text-cream-200/60">{p.caption}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Draft lyrics */}
                  {order.draftLyrics && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-gold-400/70 mb-3">
                        AI Draft: "{order.draftLyrics.title}"
                      </div>
                      <div className="bg-ink-900/60 rounded-lg p-4">
                        <div className="text-xs text-cream-200/55 italic mb-3">
                          Suno prompt: {order.draftLyrics.suno_prompt}
                        </div>
                        <pre className="font-display text-sm text-cream-100 whitespace-pre-wrap leading-relaxed">
                          {order.draftLyrics.structure
                            .map(
                              (s) =>
                                `[${formatSectionLabel(s.section).toUpperCase()}]\n${s.lines.join("\n")}`
                            )
                            .join("\n\n")}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-gold-400/70 mb-1">{label}</div>
      <div className="text-cream-100">{children}</div>
    </div>
  );
}
