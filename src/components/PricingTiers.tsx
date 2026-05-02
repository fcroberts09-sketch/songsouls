import Link from "next/link";
import { TIERS, VISIBLE_TIERS, getTier } from "@/lib/pricing";

export default function PricingTiers() {
  const visible = VISIBLE_TIERS.map((id) => getTier(id)!).filter(Boolean);

  return (
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 relative scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            How much
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-cream-100 mb-4">
            Choose how finished{" "}
            <span className="font-display-italic text-gold-shine">it should feel.</span>
          </h2>
          <p className="text-cream-200/60 max-w-2xl mx-auto">
            Every tier starts with a free lyric draft. You only pay when you've seen the words and want them brought to life.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {visible.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-6 sm:p-8 flex flex-col ${
                tier.highlighted
                  ? "bg-gradient-to-b from-gold-500/15 via-ink-800/60 to-ink-900/60 border-2 border-gold-400/40 shadow-2xl shadow-gold-700/20"
                  : "card-deep"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold-400 text-ink-950 text-[10px] font-semibold tracking-widest uppercase">
                  Most loved
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-2xl text-cream-100 mb-2">{tier.name}</h3>
                <p className="text-sm text-cream-200/60 mb-6 leading-relaxed">{tier.tagline}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl text-gold-shine">${tier.price}</span>
                  {tier.id === "life-album" && (
                    <span className="text-cream-200/50 text-sm">total</span>
                  )}
                </div>
                <div className="text-xs uppercase tracking-widest text-cream-200/40 mt-2">
                  {tier.turnaround} turnaround
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.includes.map((line, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-cream-200/80">
                    <svg
                      className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {line}
                  </li>
                ))}
              </ul>

              {tier.footnote && (
                <p className="text-xs text-cream-200/50 italic mb-6 leading-relaxed">
                  {tier.footnote}
                </p>
              )}

              <Link
                href={`/create?tier=${tier.id}`}
                className={tier.highlighted ? "btn-primary justify-center w-full" : "btn-ghost justify-center w-full"}
              >
                {tier.id === "life-album" ? "Begin the album" : "Begin a song"}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-cream-200/50 text-sm mt-10 max-w-2xl mx-auto">
          Working with a therapist or grief counselor? <Link href="/about" className="text-gold-300 hover:text-gold-200 underline underline-offset-4">Reach out about our practitioner program.</Link>
        </p>
      </div>
    </section>
  );
}
