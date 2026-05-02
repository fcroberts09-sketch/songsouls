"use client";

import type { GeneratedLyrics } from "@/types/order";
import LyricsDisplay from "../LyricsDisplay";

interface StepPreviewProps {
  loading: boolean;
  error: string | null;
  lyrics: GeneratedLyrics | null;
  onRegenerate: () => void;
}

export default function StepPreview({ loading, error, lyrics, onRegenerate }: StepPreviewProps) {
  return (
    <div>
      <header className="mb-8 text-center">
        <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
          Step 5 of 5
        </div>
        <h2 className="font-display text-3xl md:text-5xl text-cream-100 mb-3">
          Your free draft.
        </h2>
        <p className="text-cream-200/60 max-w-lg mx-auto">
          The first verse and chorus, written from what you shared. If it lands, choose how you want it finished below.
        </p>
      </header>

      <div className="max-w-2xl mx-auto">
        {loading && (
          <div className="card-deep rounded-2xl p-10 text-center">
            <div className="inline-block w-12 h-12 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin mb-6" />
            <h3 className="font-display text-2xl text-cream-100 mb-2">
              Writing your song…
            </h3>
            <p className="text-sm text-cream-200/55 max-w-xs mx-auto">
              Our songwriter is reading your story. Usually 10–20 seconds.
            </p>

            <div className="mt-8 space-y-2 max-w-md mx-auto">
              <div className="h-3 rounded shimmer" />
              <div className="h-3 rounded shimmer w-5/6" />
              <div className="h-3 rounded shimmer w-4/6" />
              <div className="h-3 rounded shimmer w-3/4 mt-6" />
              <div className="h-3 rounded shimmer w-5/6" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="card-deep rounded-2xl p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-500/15 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-rose-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3m0 3.5h.01M5.06 19h13.88c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.72 3z"
                />
              </svg>
            </div>
            <h3 className="font-display text-xl text-cream-100 mb-2">{error}</h3>
            <p className="text-sm text-cream-200/55 mb-6">It happens — try again.</p>
            <button onClick={onRegenerate} className="btn-ghost">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && lyrics && (
          <>
            <LyricsDisplay lyrics={lyrics} preview />

            <div className="mt-6 flex items-center justify-center">
              <button
                onClick={onRegenerate}
                className="text-sm text-cream-200/60 hover:text-gold-300 inline-flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-full"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try a different draft
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
