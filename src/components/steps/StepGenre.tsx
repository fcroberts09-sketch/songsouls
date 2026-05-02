"use client";

import { GENRES, ACCENT_CLASSES } from "@/lib/genres";
import type { GenreId } from "@/lib/genres";

interface StepGenreProps {
  value: GenreId | null;
  onSelect: (id: GenreId) => void;
}

export default function StepGenre({ value, onSelect }: StepGenreProps) {
  return (
    <div>
      <header className="mb-8 sm:mb-10 text-center">
        <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
          Step 1 of 5
        </div>
        <h2 className="font-display text-3xl md:text-5xl text-cream-100 mb-4">
          What kind of song?
        </h2>
        <p className="text-cream-200/60 max-w-lg mx-auto px-2">
          Pick whatever fits. We'll ask the right questions next.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {GENRES.map((genre) => {
          const accent = ACCENT_CLASSES[genre.accent];
          const selected = value === genre.id;
          return (
            <button
              key={genre.id}
              onClick={() => onSelect(genre.id)}
              className={`text-left rounded-2xl p-5 sm:p-6 transition-all relative overflow-hidden border ${
                selected
                  ? "border-gold-400/60 bg-gradient-to-b from-gold-500/10 to-transparent ring-2 ring-gold-400/30"
                  : "border-cream-100/10 bg-ink-900/50 hover:border-cream-100/25 hover:bg-ink-800/40 active:bg-ink-800/60"
              }`}
            >
              <div
                className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${accent.gradient} blur-2xl`}
              />
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-lg ${accent.bg} flex items-center justify-center mb-4`}
                >
                  <svg
                    className={`w-5 h-5 ${accent.text}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={genre.iconPath} />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-cream-100 mb-1.5">
                  {genre.name}
                </h3>
                <p className="text-xs text-cream-200/55 leading-relaxed">
                  {genre.tagline}
                </p>

                {selected && (
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-gold-300">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Selected
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
