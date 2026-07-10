import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI & Trust",
  description:
    "How Aivre's AI works: grounded generation, cited sources, a suggestion lifecycle where nothing writes itself, and hard limits on what the AI will never do.",
};

export default function AiTrustPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">How the AI works — and what it will never do</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        This page exists because your license, your E&amp;O carrier, and your lender&rsquo;s vendor-management
        team all deserve a straight answer. Show it to them.
      </p>

      <h2 className="mt-12 text-xl font-semibold">The suggestion lifecycle</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Every AI output in Aivre — a narrative draft, a suggested adjustment, a photo label — is born as a
        <b> pending suggestion</b>. It sits in a visibly distinct card showing the proposed value, the
        reasoning, and the exact report fields it was derived from. It becomes part of your report in one
        case only: you click <b>Accept</b>. Rejecting it is one click too, and both outcomes are recorded in
        the report&rsquo;s append-only audit trail — because a rejected suggestion is evidence that you
        exercised judgment.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Grounded generation, or nothing</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
        <li>
          <b>Only your data.</b> Drafts are generated from the structured fields of the report you are
          working on — never from the model&rsquo;s general knowledge of &ldquo;what markets do,&rdquo; and never from
          other customers&rsquo; reports.
        </li>
        <li>
          <b>Sources cited.</b> Every draft returns the list of fields it used. A draft without sources is
          rejected by the application before you ever see it.
        </li>
        <li>
          <b>Insufficient data is an answer.</b> If the fields don&rsquo;t support a narrative, the AI says
          exactly that and names what&rsquo;s missing. It does not improvise a market trend, a flood zone, or a
          comparable.
        </li>
        <li>
          <b>Math is code, not prose.</b> Net/gross percentages, adjusted ranges, and market trend figures
          are computed deterministically by the application. The AI narrates numbers it is handed; it never
          invents them.
        </li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold">What the AI will never do</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
        <li>It will never set, alter, or recommend your <b>opinion of value</b>.</li>
        <li>It will never change an <b>adjustment</b>, a <b>condition rating</b>, or a <b>quality rating</b> without your explicit accept.</li>
        <li>It will never write into a field uninvited — there is no &ldquo;auto-complete my report&rdquo; button, by design.</li>
        <li>It will never train on your reports. Your data is your workfile, not our corpus.</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold">Accountability you can produce on demand</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Every value in an Aivre report carries provenance — public record, MLS, inspection, appraiser, or
        AI — with a timestamp. The workfile export contains the full dataset, every suggestion (accepted
        and rejected), and the complete audit trail. If a state board or a lender asks &ldquo;where did this
        sentence come from,&rdquo; the answer is one export away.
      </p>

      <p className="mt-12 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-5 text-zinc-500">
        Aivre provides workflow software, not appraisal, legal, or USPAP advice. The signing appraiser
        remains solely responsible for the appraisal. Under USPAP, that responsibility cannot be delegated
        — to a trainee, to a typist, or to a model. Aivre is built so it never has to be.
      </p>
    </div>
  );
}
