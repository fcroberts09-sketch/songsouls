import Link from "next/link";
import { brand } from "@/lib/brand";

export default function Hero() {
  return (
    <section className="relative pt-40 pb-32 overflow-hidden">
      {/* Ambient candle glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-gold-400/10 blur-3xl animate-soft-pulse" />
        <div
          className="absolute top-1/2 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/8 blur-3xl animate-soft-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-rose-500/8 blur-3xl animate-soft-pulse"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 text-center relative">
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-400/8 border border-gold-400/20 text-xs text-gold-200 tracking-widest uppercase mb-8 animate-fade-in"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-soft-pulse" />
          Personalized songs · written from your story · produced with AI
        </div>

        {/* Headline */}
        <h1
          className="font-display text-5xl md:text-7xl lg:text-[5.5rem] text-cream-100 mb-6 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          The people you love,{" "}
          <span className="font-display-italic text-gold-shine">set to music.</span>
        </h1>

        <p
          className="text-lg md:text-xl text-cream-200/70 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-up"
          style={{ animationDelay: "0.25s" }}
        >
          {brand.description}
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
          style={{ animationDelay: "0.4s" }}
        >
          <Link href="/create" className="btn-primary text-base">
            Begin a song
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
          <Link href="/songs" className="btn-ghost text-base">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Listen first
          </Link>
        </div>

        {/* Soft disclosure */}
        <p
          className="mt-12 text-sm text-cream-200/45 max-w-xl mx-auto animate-fade-up"
          style={{ animationDelay: "0.55s" }}
        >
          Each song is written by a songwriter from your story, then produced with AI-assisted vocals and instrumentation.
        </p>
      </div>
    </section>
  );
}
