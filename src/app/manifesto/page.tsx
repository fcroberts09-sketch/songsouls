import Link from "next/link";

export const metadata = {
  title: "Manifesto",
  description: "Why we make personalized songs.",
};

export default function ManifestoPage() {
  return (
    <article className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-16">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            Manifesto
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-cream-100">
            Why we <span className="font-display-italic text-gold-shine">make these.</span>
          </h1>
        </header>

        <div className="font-display text-xl md:text-2xl text-cream-100/90 leading-relaxed space-y-8">
          <p>
            People we love die. People we love grow up and move out. People we love stop being people we love. Some of them never knew, when they had us, what they meant.
          </p>

          <p>
            Cards aren't enough. Photos sit in folders. Toasts pass. The right song — the one written for one specific person, in your voice, from your story — doesn't pass. It plays at the wedding. It plays in the car after the funeral. It plays on the eight-year-old's birthday for the rest of his life.
          </p>

          <p>
            We started SongSouls because we couldn't find this for our own people. Because the AI tools you've seen feel cheap, and the custom songwriters cost more than most people can spend, and we wanted a third thing: a real songwriter, helped by a real AI, working from a real story, at a price that says <em>yes, you can do this for them</em>.
          </p>

          <p>
            We don't write generic happy birthdays. We don't write greeting-card platitudes. We don't write "you light up my world." We write the smell of her kitchen. The way he hummed on Sundays. The Tuesday morning you don't tell anyone about.
          </p>

          <p>
            We work with therapists, with grief counselors, with wedding planners, with daughters who never wrote a poem in their life. We work with people who didn't know they were songwriters until they typed the first answer and saw something they didn't know they remembered.
          </p>

          <p className="font-display-italic text-gold-200">
            Songs are how the people we love stay close. We're here to help you write theirs.
          </p>
        </div>

        <div className="mt-20 text-center">
          <Link href="/create" className="btn-primary">
            Begin a song
          </Link>
        </div>
      </div>
    </article>
  );
}
