import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources",
  description: "Guides on UAD 3.6, ANSI measurement, and avoiding revision requests.",
};

const POSTS = [
  {
    title: "The UAD 3.6 field map: what actually changed from the 1004",
    teaser:
      "The dynamic URAR isn't a new form — it's the end of forms. A walkthrough of how subject characteristics drive which sections exist, and what that means for your workflow.",
    tag: "UAD 3.6",
  },
  {
    title: "ANSI Z765-2021 pitfalls that trigger hard stops",
    teaser:
      "Below-grade rec rooms, half-story bonus areas, and why your sketch total and grid GLA disagreeing by 40 sq ft is a delivery problem, not a rounding error.",
    tag: "Measurement",
  },
  {
    title: "Why reports get revision requests (and how to stop feeding the machine)",
    teaser:
      "Unbracketed values, over-guideline adjustments without support, stale comps without comment. The predictable list — and how to catch every item before you hit send.",
    tag: "Quality",
  },
  {
    title: "AI in the appraisal workfile: what your E&O carrier will ask",
    teaser:
      "Provenance, audit trails, and why 'the software wrote it' is never a defense — but 'here's the audit trail of what I accepted and rejected' is a very good one.",
    tag: "AI & Trust",
  },
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        Field guides for working appraisers. Full articles are coming with launch — these are the first
        four on the editorial calendar.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {POSTS.map((p) => (
          <article key={p.title} className="rounded-lg border border-zinc-200 p-5">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
              {p.tag}
            </span>
            <h2 className="mt-2 text-base font-semibold leading-6">{p.title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600">{p.teaser}</p>
            <p className="mt-3 text-xs font-medium text-zinc-400">Coming soon</p>
          </article>
        ))}
      </div>
    </div>
  );
}
