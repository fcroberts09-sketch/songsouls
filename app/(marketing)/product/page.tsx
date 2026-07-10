import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product",
  description:
    "Dynamic URAR, spreadsheet-grade comp grid, live compliance QC, AI commentary with provenance, mobile inspection, and one-click workfile export.",
};

const SECTIONS: { title: string; lead: string; points: string[] }[] = [
  {
    title: "Dynamic URAR — the dataset is the report",
    lead: "Aivre models the UAD 3.6 dataset directly. Sections derive from the subject: a condo gets its project section, a duplex gets the rent schedule, a manufactured home gets its HUD labeling — automatically, with the inclusion reason shown.",
    points: [
      "One report type covers SFR, condo, co-op, 2–4 unit, and manufactured",
      "MISMO data-point IDs visible on every field — the XML is never a surprise",
      "Completeness % computed from the actual required-field registry, not a guess",
    ],
  },
  {
    title: "The comp grid — faster than your spreadsheet",
    lead: "Subject first, comps across, UAD attributes down. Inline adjustment cells, Enter-commits-and-moves editing, Ctrl+arrow navigation, and net/gross/adjusted math that recomputes as you type. No spinners on local edits, ever.",
    points: [
      "Guideline flags per comp: distance, sale age, GLA delta, line/net/gross thresholds",
      "Find-comps returns ranked candidates with scores and rationale — you decide what enters the grid",
      "Every comp carries its MLS provenance; concessions get flagged for dollar-for-dollar treatment",
    ],
  },
  {
    title: "Live compliance & QC — the rules run while you work",
    lead: "A rules engine recomputes on every edit and sorts findings into Blockers (will fail UCDP), Warnings (revision-request risk), and Notes. Each one is click-to-navigate to the offending field.",
    points: [
      "Required UAD fields per property type, including dynamic sections",
      "ANSI Z765-2021 consistency: sketch totals must reconcile with reported GLA",
      "Bracketing check: a value opinion outside the adjusted comp range gets flagged before your client flags it",
      "Photo evidence: claim a C5 and the engine expects deficiency photos",
    ],
  },
  {
    title: "AI commentary — drafts with receipts",
    lead: "Neighborhood, market conditions, improvements, reconciliation: drafted from your report's structured fields, delivered as pending suggestions that cite their sources. Accept, edit, or reject — every decision is audited.",
    points: [
      "The AI never sets or alters the value opinion, adjustments, or condition/quality ratings",
      "Thin data produces “insufficient data — complete these fields,” not fiction",
      "Adjustment suggestions show their math (delta × market-derived rate) and skip anything you've already adjusted",
    ],
  },
  {
    title: "Field inspection on your phone",
    lead: "A one-handed mobile mode: photo capture with instant labeling, big C/Q rating buttons with the UAD definitions inline, GLA quick entry, and an effective-date stamp the moment you start.",
    points: [
      "Photos carry capture-time provenance into the report",
      "AI photo labeling is a suggestion like everything else — accept or override",
    ],
  },
  {
    title: "Workfile & delivery",
    lead: "The export preflight builds a UCDP-ready package — MISMO 3.6 XML, PDF, and the image folder — only when blockers are zero. The full workfile (data, sources, every accepted and rejected suggestion, sign-offs) exports in one click.",
    points: [
      "Trainee reports route through supervisor sign-off before packaging (USPAP supervision)",
      "The audit trail is append-only — nothing in Aivre silently overwrites anything",
    ],
  },
];

export default function ProductPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">The product, mapped to your workday</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
        Everything below is live in the demo right now — open it and follow along. No screenshots of
        features that don&rsquo;t exist.
      </p>
      <div className="mt-12 space-y-12">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{s.lead}</p>
            <ul className="mt-3 space-y-1.5">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2 text-sm text-zinc-700">
                  <span className="mt-0.5 text-indigo-500">→</span>
                  {p}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-14 rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center">
        <p className="text-sm font-medium">Seeded demo, five orders, every property type.</p>
        <Link
          href="/demo"
          className="mt-3 inline-block rounded-lg bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
        >
          Try it live
        </Link>
      </div>
    </div>
  );
}
