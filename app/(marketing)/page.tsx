import Link from "next/link";

export default function Landing() {
  return (
    <>
      {/* hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
              UAD 3.6-native · dynamic URAR
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              The AI does the typing.
              <br />
              <span className="text-indigo-600">You do the appraising.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-7 text-zinc-600">
              Aivre is appraisal software built around the UAD 3.6 dataset — not a form-filler. A live
              compliance engine catches revision-request bait before delivery, and AI drafts your
              narratives from the report&rsquo;s own data, with sources cited and nothing written until you
              accept it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="rounded-lg bg-(--color-accent) px-5 py-3 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
              >
                Try the live demo — no sign-up
              </Link>
              <Link
                href="/product"
                className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                See how the QC engine works
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-400">
              The demo is fully seeded — five orders, every property type, nothing to configure.
            </p>
          </div>

          {/* stylized product mock: QC panel */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
            <div className="rounded-lg border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Compliance &amp; QC — live
                </span>
                <span className="font-mono text-[11px] font-semibold">
                  <span className="text-red-600">1B</span> <span className="text-amber-600">3W</span>{" "}
                  <span className="text-zinc-400">5N</span>
                </span>
              </div>
              {[
                ["Blocker", "Missing final opinion of value", "border-red-200 bg-red-50 text-red-700"],
                ["Warning", "Comp 3: 1.18 mi from subject (guideline ≤ 1 mi)", "border-amber-200 bg-amber-50 text-amber-700"],
                ["Warning", "Missing required photo: subject rear", "border-amber-200 bg-amber-50 text-amber-700"],
                ["Note", "Comp 3: 1 adjustment without documented support", "border-zinc-200 bg-zinc-50 text-zinc-600"],
              ].map(([sev, msg, cls]) => (
                <div key={msg} className="flex items-start gap-2 border-b border-zinc-100 px-3 py-2 last:border-0">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>{sev}</span>
                  <span className="text-xs leading-4 text-zinc-700">{msg}</span>
                  <span className="ml-auto whitespace-nowrap text-[10px] text-indigo-600">Go to field →</span>
                </div>
              ))}
              <div className="border-t border-zinc-200 bg-indigo-50/50 px-3 py-2 text-center text-xs font-medium text-indigo-700">
                Resolve 1 issue → then “Build UCDP package”
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-zinc-400">
              Every issue is click-to-navigate. The export button stays locked until blockers hit zero.
            </p>
          </div>
        </div>
      </section>

      {/* three pillars */}
      <section className="border-t border-zinc-100 bg-zinc-50/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          {[
            {
              t: "First-submission quality",
              d: "A live rules engine recomputes on every keystroke: required UAD fields, ANSI sketch consistency, comp guidelines, bracketing, photo evidence. Blockers physically gate the UCDP package build.",
            },
            {
              t: "AI write-ups with receipts",
              d: "Neighborhood, market conditions, improvements, reconciliation — drafted strictly from your report's structured data, with the source fields cited. If the data doesn't support it, the AI says so instead of improvising.",
            },
            {
              t: "A defensible workfile",
              d: "Every autofill, edit, AI suggestion — accepted or rejected — lands in an append-only audit trail with source and timestamp. Export the whole workfile in one click. USPAP record keeping, handled.",
            },
          ].map((f) => (
            <div key={f.t}>
              <h3 className="text-base font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight">One report type. Every assignment.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          The dynamic URAR turns sections on and off from the subject itself — SFR, condo, co-op, 2–4
          unit, manufactured. You never pick a form number again.
        </p>
        <ol className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            ["Inspect", "One-handed mobile mode: photos labeled on capture, C1–C6 / Q1–Q6 with inline UAD definitions, effective date stamped on site."],
            ["Build the grid", "Ranked comp candidates you drag in. Inline adjustments, live net/gross math, guideline flags — faster than the spreadsheet you're using now."],
            ["Draft with AI", "Commentary lands as suggestions with cited sources. Accept, edit, or reject — nothing writes itself into your report."],
            ["Deliver clean", "The preflight builds a UCDP package (MISMO 3.6 XML + PDF + photos) only when blockers are zero. Trainee work routes through supervisor sign-off."],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-lg border border-zinc-200 p-4">
              <div className="text-xs font-bold text-indigo-600">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-1 text-sm font-semibold">{t}</h3>
              <p className="mt-1.5 text-xs leading-5 text-zinc-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* closing CTA */}
      <section className="border-t border-zinc-100 bg-zinc-900">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Appraisers will trust software exactly as far as it earns it.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            That&rsquo;s why every AI value in Aivre shows where it came from, and why the demo is open —
            go try to break it.
          </p>
          <Link
            href="/demo"
            className="mt-8 inline-block rounded-lg bg-(--color-accent) px-6 py-3 text-sm font-semibold text-white hover:bg-(--color-accent-hover)"
          >
            Open the live demo
          </Link>
        </div>
      </section>
    </>
  );
}
