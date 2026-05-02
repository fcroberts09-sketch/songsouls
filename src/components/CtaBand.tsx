import Link from "next/link";

export default function CtaBand() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="card-deep rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden">
          {/* Glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold-400/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="font-display-italic text-gold-300 text-sm tracking-wide mb-4">
              The hardest part is starting.
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-cream-100 mb-5 sm:mb-6 leading-tight">
              Who do you want to write a song for?
            </h2>
            <p className="text-cream-200/60 max-w-xl mx-auto mb-8 sm:mb-10">
              Tell us about them. We'll show you the first verse in under a minute — free.
              You decide what to do next.
            </p>
            <Link href="/create" className="btn-primary text-base">
              Begin a song
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
