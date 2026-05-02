import { SHOWCASE_SONGS } from "@/lib/songs";
import SongCard from "@/components/SongCard";

export const metadata = {
  title: "Listen",
  description: "A library of songs we've written for the people behind them.",
};

export default function SongsPage() {
  // Sort by addedAt descending
  const songs = [...SHOWCASE_SONGS].sort((a, b) =>
    b.addedAt.localeCompare(a.addedAt)
  );

  return (
    <div className="min-h-screen pt-24 sm:pt-32 pb-20 sm:pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            The library
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-cream-100 mb-4 sm:mb-5">
            Songs from{" "}
            <span className="font-display-italic text-gold-shine">real lives.</span>
          </h1>
          <p className="text-cream-200/65 text-base sm:text-lg leading-relaxed">
            Every song here was written for one specific person, from the words their
            person sent us. Press play. Stay a while.
          </p>
        </header>

        {songs.length === 0 ? (
          <div className="text-center text-cream-200/50 py-20">
            No songs in the library yet. Edit{" "}
            <code className="bg-ink-800 px-2 py-0.5 rounded">src/lib/songs.ts</code> to add yours.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {songs.map((song) => (
              <SongCard key={song.slug} song={song} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
