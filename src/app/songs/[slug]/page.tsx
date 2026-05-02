import { notFound } from "next/navigation";
import Link from "next/link";
import { getShowcaseSong, SHOWCASE_SONGS } from "@/lib/songs";
import AudioPlayer from "@/components/AudioPlayer";

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return SHOWCASE_SONGS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const song = getShowcaseSong(params.slug);
  if (!song) return { title: "Song not found" };
  return {
    title: song.title,
    description: song.dedication,
  };
}

export default function SongPage({ params }: PageProps) {
  const song = getShowcaseSong(params.slug);
  if (!song) {
    notFound();
    // notFound() throws — the line below is unreachable but satisfies TS narrowing.
    return null;
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/songs"
          className="inline-flex items-center gap-2 text-sm text-cream-200/60 hover:text-gold-300 mb-10 group"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to library
        </Link>

        {/* Hero — cover + title */}
        <div className="grid md:grid-cols-2 gap-10 mb-14">
          <div className="aspect-square rounded-2xl overflow-hidden card-deep relative">
            {song.coverImage ? (
              <img src={song.coverImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${song.coverGradient || "from-ink-700 to-ink-900"} flex items-center justify-center`}
              >
                <svg className="w-24 h-24 text-cream-100/40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 18V5l12-2v13a3 3 0 1 1-2-2.83V6.34L11 8v10a3 3 0 1 1-2-2.83V18z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
              {song.genre}
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-cream-100 mb-3">
              {song.title}
            </h1>
            <p className="font-display-italic text-cream-200/70 text-lg mb-8">
              {song.dedication}
            </p>

            <div className="card-deep rounded-xl p-4">
              <AudioPlayer src={song.audioUrl} title={song.title} />
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-cream-200/50">
              <span>{song.duration}</span>
              <span>·</span>
              <span className="capitalize">{song.tier.replace("-", " ")} tier</span>
            </div>
          </div>
        </div>

        {/* Story */}
        <section className="mb-16">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            The story
          </div>
          <p className="font-display-italic text-2xl md:text-3xl text-cream-100 leading-relaxed">
            "{song.story}"
          </p>
        </section>

        {/* Lyrics */}
        {song.lyrics?.trim() && (
          <section className="mb-16">
            <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-4">
              The lyrics
            </div>
            <div className="card-deep rounded-2xl p-8 md:p-12">
              <pre className="font-display text-cream-100/95 leading-relaxed whitespace-pre-wrap text-lg">
                {song.lyrics}
              </pre>
            </div>
          </section>
        )}

        {/* Recipient quote */}
        {song.recipientQuote && (
          <section className="mb-16">
            <div className="card-deep rounded-2xl p-8 md:p-12 text-center">
              <svg
                className="w-10 h-10 text-gold-400/40 mx-auto mb-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 17l3-7H3V3h7v7l-3 7zm11 0l3-7h-3V3h7v7l-3 7z" />
              </svg>
              <p className="font-display-italic text-xl md:text-2xl text-cream-100/90 leading-relaxed mb-4">
                "{song.recipientQuote}"
              </p>
              {song.recipientQuoteAuthor && (
                <div className="text-sm text-cream-200/55">
                  — {song.recipientQuoteAuthor}
                </div>
              )}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="text-center pt-8">
          <h2 className="font-display text-3xl text-cream-100 mb-4">
            Want one for your person?
          </h2>
          <p className="text-cream-200/60 mb-8 max-w-md mx-auto">
            The first verse is free. You only pay when it's worth keeping.
          </p>
          <Link href="/create" className="btn-primary">
            Begin a song
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </section>
      </div>
    </div>
  );
}
