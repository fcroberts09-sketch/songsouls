import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";

export const metadata = {
  title: "Manifesto",
  description: "Why we make personalized songs.",
};

export default function ManifestoPage() {
  return (
    <article className="min-h-screen pt-24 sm:pt-32 pb-20 sm:pb-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12 sm:mb-16">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            Manifesto
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-cream-100">
            Why we <span className="font-display-italic text-gold-shine">make these.</span>
          </h1>
        </header>

        <div className="font-display text-lg sm:text-xl md:text-2xl text-cream-100/90 leading-relaxed space-y-6 sm:space-y-8">
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
            We work with husbands, with daughters, with best friends of twenty years, with wedding planners, with people who never wrote a poem in their life. We work with people who didn't know they were songwriters until they typed the first answer and saw something they didn't know they remembered.
          </p>

          <p className="font-display-italic text-gold-200">
            Songs are how the people we love stay close. We're here to help you write theirs.
          </p>
        </div>

        <section className="card-deep rounded-2xl p-6 sm:p-8 md:p-10 mt-16 sm:mt-20">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-4">
            From the founder
          </div>
          <h2 className="font-display text-3xl text-cream-100 mb-6">
            Why I made this
          </h2>
          <div className="space-y-5 text-cream-200/85 leading-relaxed text-[17px]">
            <p>
              We created this because I stumbled across some AI song generation software that could turn what you&rsquo;ve written into music.
            </p>
            <p>
              I had been journaling about the loss of my father for many years &mdash; random thoughts, how I felt, the things that were real, my memories, the sadness. But I don&rsquo;t think it had ever really been a focus. I&rsquo;ve never really known how I felt, and I always landed in the same place.
            </p>
            <p>
              Last year, while I was hiking and journaling, it hit me &mdash; you can&rsquo;t miss something you never knew. I always landed on this &mdash; you can&rsquo;t have sadness for someone you never knew, you can&rsquo;t miss someone you never knew. And that&rsquo;s tragic and sad.
            </p>
            <p>
              For me, songs are about finding another way to connect with things you may not even know you feel. I&rsquo;ll share a very intimate song that has really uplifted my life and given me a freedom of emotion and feeling that I didn&rsquo;t know I could have. That&rsquo;s what pushed me to create this.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gold-700/15">
            <div className="text-xs uppercase tracking-widest text-gold-400/70 mb-3">
              The song
            </div>
            <div className="font-display text-2xl text-cream-100 mb-5">
              Gas Station Ghost
            </div>
            <AudioPlayer src="/songs/gas-station-ghost.mp3" title="Gas Station Ghost" />
          </div>
        </section>

        <div className="mt-16 sm:mt-20 text-center">
          <Link href="/create" className="btn-primary">
            Begin a song
          </Link>
        </div>
      </div>
    </article>
  );
}
