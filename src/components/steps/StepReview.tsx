"use client";

import { VISIBLE_TIERS, getTier } from "@/lib/pricing";
import type { TierId } from "@/lib/pricing";
import type { Genre } from "@/lib/genres";

interface StepReviewProps {
  selectedTier: TierId;
  setSelectedTier: (id: TierId) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerNote: string;
  setCustomerNote: (v: string) => void;

  // Order summary data (read-only — collected in earlier steps)
  genre: Genre;
  recipientName: string;
  recipientRelationship: string;
  occasion: string;
  answers: Record<string, string>;
}

export default function StepReview(props: StepReviewProps) {
  const {
    selectedTier,
    setSelectedTier,
    customerEmail,
    setCustomerEmail,
    customerName,
    setCustomerName,
    customerNote,
    setCustomerNote,
    genre,
    recipientName,
    recipientRelationship,
    occasion,
    answers,
  } = props;

  const visible = VISIBLE_TIERS.map((id) => getTier(id)!).filter(Boolean);
  const tier = getTier(selectedTier);

  // Pull a couple of intake answers to display, just enough to confirm what
  // they shared. We don't show the AI draft.
  const answerSnippets = genre.questions
    .slice(0, 3)
    .map((q) => {
      const a = (answers[q.id] || "").trim();
      if (!a) return null;
      const truncated = a.length > 140 ? a.slice(0, 140).trimEnd() + "…" : a;
      return { label: q.prompt, answer: truncated };
    })
    .filter((x): x is { label: string; answer: string } => x !== null);

  return (
    <div>
      <header className="mb-8 text-center">
        <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
          Review &amp; pay
        </div>
        <h2 className="font-display text-3xl md:text-5xl text-cream-100 mb-3">
          One look, then we begin.
        </h2>
        <p className="text-cream-200/60 max-w-lg mx-auto">
          Confirm your tier and where to send it. Payment starts the work.
        </p>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Tier selection */}
        <div className="grid md:grid-cols-2 gap-4">
          {visible.map((t) => {
            const isSelected = selectedTier === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTier(t.id)}
                className={`text-left rounded-2xl p-6 transition-all border-2 ${
                  isSelected
                    ? "border-gold-400 bg-gradient-to-b from-gold-500/15 to-transparent"
                    : "border-cream-100/10 bg-ink-900/50 hover:border-cream-100/25"
                }`}
              >
                {t.highlighted && (
                  <div className="text-[10px] uppercase tracking-widest text-gold-300 mb-1">
                    Most loved
                  </div>
                )}
                <h3 className="font-display text-xl text-cream-100 mb-1">
                  {t.name}
                </h3>
                <p className="text-xs text-cream-200/55 mb-3">{t.tagline}</p>
                <div className="font-display text-4xl text-gold-shine">
                  ${t.price}
                </div>
                <div className="text-xs uppercase tracking-widest text-cream-200/45 mt-1 mb-4">
                  {t.turnaround}
                </div>
                <ul className="space-y-1.5">
                  {t.includes.map((line, j) => (
                    <li key={j} className="text-xs text-cream-200/75 flex gap-1.5">
                      <span className="text-gold-400">✓</span>
                      {line}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Soft disclosure line under price */}
        {tier && (
          <p className="text-center text-xs text-cream-200/50 -mt-2">
            ${tier.price} — songs are written by a songwriter from your story and produced with AI-assisted vocals and instrumentation.
          </p>
        )}

        {/* Order summary */}
        <div className="card-deep rounded-2xl p-6 md:p-8">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-4">
            Your song, so far
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
            <div>
              <dt className="text-cream-200/45 mb-0.5">Genre</dt>
              <dd className="text-cream-100">{genre.name}</dd>
            </div>
            <div>
              <dt className="text-cream-200/45 mb-0.5">For</dt>
              <dd className="text-cream-100">
                {recipientName}
                {recipientRelationship ? (
                  <span className="text-cream-200/55"> · {recipientRelationship}</span>
                ) : null}
              </dd>
            </div>
            {occasion && (
              <div className="sm:col-span-2">
                <dt className="text-cream-200/45 mb-0.5">Occasion</dt>
                <dd className="text-cream-100">{occasion}</dd>
              </div>
            )}
          </dl>

          {answerSnippets.length > 0 && (
            <div className="border-t border-cream-100/8 pt-5 space-y-3">
              {answerSnippets.map((a, i) => (
                <div key={i}>
                  <div className="text-xs text-cream-200/45 mb-1">{a.label}</div>
                  <div className="text-sm text-cream-200/85 leading-relaxed">{a.answer}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer details */}
        <div className="card-deep rounded-2xl p-6 md:p-8 space-y-5">
          <h3 className="font-display text-xl text-cream-100">Where do we send it?</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-cream-100 block mb-2">
                Your name <span className="text-gold-400">*</span>
              </span>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="First name is fine"
                maxLength={100}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-cream-100 block mb-2">
                Your email <span className="text-gold-400">*</span>
              </span>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={254}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-cream-100 block mb-2">
              Anything else we should know? (optional)
            </span>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="If we should be careful with anything, or if there's a tone you want…"
            />
          </label>

          <p className="text-xs text-cream-200/45 leading-relaxed">
            We&rsquo;ll email a confirmation immediately and deliver the finished song within {tier?.turnaround.toLowerCase()}.
            Your photos and answers stay private — used only to write your song.
          </p>
        </div>
      </div>
    </div>
  );
}
