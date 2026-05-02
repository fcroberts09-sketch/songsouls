import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata = {
  title: "For Therapists & Practitioners",
  description: "Bring SongSouls into your practice — for grief work, inner-child work, milestone work.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 sm:pt-32 pb-20 sm:pb-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12 sm:mb-14">
          <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
            For practitioners
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-cream-100 mb-4 sm:mb-5">
            Songs that{" "}
            <span className="font-display-italic text-gold-shine">do clinical work.</span>
          </h1>
          <p className="text-cream-200/65 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Therapists are using SongSouls in grief work, inner-child work, and milestone-of-life work. If you're a clinician — we want to talk.
          </p>
        </header>

        <section className="card-deep rounded-2xl p-6 sm:p-8 md:p-10 mb-8 sm:mb-10">
          <h2 className="font-display text-2xl text-cream-100 mb-5">Where it fits in practice</h2>
          <ul className="space-y-4 text-cream-200/80">
            <li className="flex gap-3">
              <span className="text-gold-400 mt-1">·</span>
              <div>
                <strong className="text-cream-100">Grief & memorial work.</strong> A song co-created with a client for someone they've lost — used in continuing-bonds work, anniversary dates, and integration.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-400 mt-1">·</span>
              <div>
                <strong className="text-cream-100">Inner-child work.</strong> A song from the adult to the younger self — read aloud in session, listened to between sessions, used in IFS or schema-informed practice.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-400 mt-1">·</span>
              <div>
                <strong className="text-cream-100">Milestone & rite-of-passage work.</strong> Marriages, divorces, births, retirements — a song to mark the threshold the client is crossing.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-400 mt-1">·</span>
              <div>
                <strong className="text-cream-100">Letter-that-can't-be-sent work.</strong> The estranged parent, the unspoken love, the apology that didn't land — turned into something the client can keep.
              </div>
            </li>
          </ul>
        </section>

        <section className="card-deep rounded-2xl p-6 sm:p-8 md:p-10 mb-8 sm:mb-10">
          <h2 className="font-display text-2xl text-cream-100 mb-5">Practitioner program</h2>
          <p className="text-cream-200/75 mb-5 leading-relaxed">
            We're piloting a practitioner program for licensed clinicians: a per-client rate, an intake template you can use in session, and a referral pathway for clients who want to take it further on their own.
          </p>
          <p className="text-cream-200/75 leading-relaxed">
            If you'd like to be part of the pilot, write to{" "}
            <a href={`mailto:${brand.contact.email}`} className="text-gold-300 hover:text-gold-200 underline underline-offset-4">
              {brand.contact.email}
            </a>
            {" "}with your license, modality, and one sentence about how you'd want to use it.
          </p>
        </section>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm mx-auto sm:max-w-none">
          <Link href="/create" className="btn-ghost">
            Try it yourself first
          </Link>
          <a href={`mailto:${brand.contact.email}?subject=Practitioner program`} className="btn-primary">
            Email us
          </a>
        </div>
      </div>
    </div>
  );
}
