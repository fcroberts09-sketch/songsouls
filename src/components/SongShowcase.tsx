import Link from "next/link";
import { SHOWCASE_SONGS } from "@/lib/songs";
import SongCard from "./SongCard";

export default function SongShowcase() {
  const featured = SHOWCASE_SONGS[0];
  const rest = SHOWCASE_SONGS.slice(1, 5);

  if (!featured) return null;

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
              Recently written
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-cream-100">
              Songs from <span className="font-display-italic text-gold-shine">real lives.</span>
            </h2>
            <p className="mt-4 text-cream-200/60 max-w-xl">
              Each one written for a specific person, from a specific story. Press play.
            </p>
          </div>
          <Link
            href="/songs"
            className="text-sm text-gold-300 hover:text-gold-200 inline-flex items-center gap-2 group"
          >
            See the full library
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="space-y-8">
          {/* Featured song */}
          <SongCard song={featured} variant="feature" />

          {/* Grid of others */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rest.map((song) => (
              <SongCard key={song.slug} song={song} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
