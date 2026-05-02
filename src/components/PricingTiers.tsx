import Link from "next/link";
import { VISIBLE_TIERS, getTier } from "@/lib/pricing";

export default function PricingTiers() {
  const visible = VISIBLE_TIERS.map((id) => getTier(id)!).filter(Boolean);

  return (
    <section id="pricing" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            How much
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-cream-100 mb-4">
            Two ways to{" "}
            <span className="font-display-italic text-gold-shine">begin a song.</span>
          </h2>
          <p className="text-cream-200/60 max-w-2xl mx-auto">
            Pay once, we begin. Songwriter-written lyrics, AI-assisted production.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto">
          {visible.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-8 flex flex-col ${
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
                </div>
                <div className="text-xs uppercase tracking-widest text-cream-200/40 mt-2">
                  {tier.turnaround}
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
                Begin a song
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
