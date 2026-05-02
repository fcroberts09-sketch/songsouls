"use client";

import { TIERS, VISIBLE_TIERS, getTier } from "@/lib/pricing";
import type { TierId } from "@/lib/pricing";

interface StepCheckoutProps {
  selectedTier: TierId;
  setSelectedTier: (id: TierId) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerNote: string;
  setCustomerNote: (v: string) => void;
}

export default function StepCheckout(props: StepCheckoutProps) {
  const {
    selectedTier,
    setSelectedTier,
    customerEmail,
    setCustomerEmail,
    customerName,
    setCustomerName,
    customerNote,
    setCustomerNote,
  } = props;

  const visible = VISIBLE_TIERS.map((id) => getTier(id)!).filter(Boolean);

  return (
    <div>
      <header className="mb-8 text-center">
        <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
          Bring it to life
        </div>
        <h2 className="font-display text-3xl md:text-5xl text-cream-100 mb-3">
          Choose how it's finished.
        </h2>
        <p className="text-cream-200/60 max-w-lg mx-auto">
          Same lyrics — three ways to bring them to life. Or save the draft for free.
        </p>
      </header>

      <div className="max-w-3xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {visible.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`text-left rounded-2xl p-5 transition-all border-2 ${
                  isSelected
                    ? "border-gold-400 bg-gradient-to-b from-gold-500/15 to-transparent"
                    : "border-cream-100/10 bg-ink-900/50 hover:border-cream-100/25"
                }`}
              >
                {tier.highlighted && (
                  <div className="text-[10px] uppercase tracking-widest text-gold-300 mb-1">
                    Most loved
                  </div>
                )}
                <h3 className="font-display text-xl text-cream-100 mb-1">
                  {tier.name}
                </h3>
                <div className="font-display text-3xl text-gold-shine mt-2">
                  ${tier.price}
                </div>
                <div className="text-xs text-cream-200/50 mb-3">{tier.turnaround}</div>
                <ul className="space-y-1.5">
                  {tier.includes.slice(0, 3).map((line, j) => (
                    <li key={j} className="text-xs text-cream-200/70 flex gap-1.5">
                      <span className="text-gold-400">✓</span>
                      {line}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

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
            By continuing you agree to our terms. Your photos and answers stay private — used only to write your song.
            We'll email a confirmation immediately and the finished song within {getTier(selectedTier)?.turnaround}.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-cream-200/55">
            Just want the draft? <span className="text-gold-300">It's already yours — check your email.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
