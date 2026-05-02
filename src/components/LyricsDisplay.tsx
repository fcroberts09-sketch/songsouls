"use client";

import type { GeneratedLyrics } from "@/types/order";
import { formatSectionLabel } from "@/lib/validation";

interface LyricsDisplayProps {
  lyrics: GeneratedLyrics;
  /** Show only the first verse + chorus (preview-style) */
  preview?: boolean;
}

export default function LyricsDisplay({ lyrics, preview }: LyricsDisplayProps) {
  // For preview mode, show first verse + first chorus only
  let sections = lyrics.structure;
  if (preview) {
    const firstVerse = sections.find((s) => s.section.startsWith("verse_"));
    const firstChorus = sections.find((s) => s.section === "chorus");
    sections = [firstVerse, firstChorus].filter(Boolean) as typeof sections;
  }

  return (
    <div className="card-deep rounded-2xl p-8 md:p-10">
      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-2">
          Your draft
        </div>
        <h3 className="font-display text-3xl md:text-4xl text-cream-100">
          "{lyrics.title}"
        </h3>
      </div>

      <div className="space-y-7">
        {sections.map((section, idx) => (
          <div key={idx}>
            <div className="text-[10px] uppercase tracking-widest text-gold-400/60 mb-2">
              {formatSectionLabel(section.section)}
            </div>
            <div className="font-display text-lg md:text-xl text-cream-100/95 leading-relaxed space-y-1">
              {section.lines.map((line, j) => (
                <div key={j} className="font-display-italic">
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {preview && lyrics.structure.length > sections.length && (
        <div className="mt-8 pt-6 border-t border-cream-100/10 text-center">
          <p className="text-sm text-cream-200/60 italic">
            …and {lyrics.structure.length - sections.length} more sections in the full song.
          </p>
        </div>
      )}

      {lyrics.story_note && (
        <div className="mt-8 pt-6 border-t border-cream-100/10">
          <div className="text-[10px] uppercase tracking-widest text-gold-400/60 mb-2">
            A note from us
          </div>
          <p className="text-sm text-cream-200/75 italic leading-relaxed">{lyrics.story_note}</p>
        </div>
      )}
    </div>
  );
}
