"use client";

import Link from "next/link";
import type { ShowcaseSong } from "@/types/song";
import AudioPlayer from "./AudioPlayer";

interface SongCardProps {
  song: ShowcaseSong;
  variant?: "default" | "feature";
}

export default function SongCard({ song, variant = "default" }: SongCardProps) {
  const isFeature = variant === "feature";

  return (
    <article
      className={`card-deep card-deep-hover rounded-2xl overflow-hidden ${
        isFeature ? "md:flex" : ""
      }`}
    >
      {/* Cover */}
      <Link
        href={`/songs/${song.slug}`}
        className={`relative block group ${
          isFeature ? "md:w-1/2 aspect-square md:aspect-auto" : "aspect-square"
        } overflow-hidden`}
      >
        {song.coverImage ? (
          <img
            src={song.coverImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${song.coverGradient || "from-ink-700 to-ink-900"} relative overflow-hidden`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-cream-100/40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 18V5l12-2v13a3 3 0 1 1-2-2.83V6.34L11 8v10a3 3 0 1 1-2-2.83V18z" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
          </div>
        )}

        {/* Genre tag */}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-ink-950/70 backdrop-blur-sm border border-cream-100/15 text-[11px] uppercase tracking-widest text-cream-200/80">
          {song.genre}
        </div>
      </Link>

      {/* Body */}
      <div className={`p-6 ${isFeature ? "md:w-1/2 md:p-10 md:flex md:flex-col md:justify-center" : ""}`}>
        <Link href={`/songs/${song.slug}`} className="group">
          <h3
            className={`font-display text-cream-100 group-hover:text-gold-200 transition-colors ${
              isFeature ? "text-3xl md:text-4xl mb-3" : "text-xl mb-2"
            }`}
          >
            {song.title}
          </h3>
        </Link>

        <p className="font-display-italic text-cream-200/60 text-sm mb-4">
          {song.dedication}
        </p>

        {isFeature && (
          <p className="text-cream-200/70 text-sm leading-relaxed mb-6 line-clamp-3">
            {song.story}
          </p>
        )}

        <div className="border-t border-cream-100/10 pt-4">
          <AudioPlayer src={song.audioUrl} title={song.title} compact={!isFeature} />
        </div>

        {isFeature && (
          <Link
            href={`/songs/${song.slug}`}
            className="inline-flex items-center gap-2 text-sm text-gold-300 hover:text-gold-200 mt-6 group"
          >
            Read the story
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </article>
  );
}
