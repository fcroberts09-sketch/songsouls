import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance",
  description:
    "USPAP alignment, UAD 3.6 / MISMO 3.6, ANSI Z765-2021 measurement, supervision workflow, and data handling — written for vendor-management review.",
};

const ROWS: { area: string; detail: string }[] = [
  {
    area: "USPAP — responsibility",
    detail:
      "The signing appraiser controls every value in the report. AI output enters only via an explicit, audited accept. The platform contains no mechanism for automated valuation of the subject.",
  },
  {
    area: "USPAP — record keeping",
    detail:
      "The workfile (full dataset, provenance, every AI suggestion accepted or rejected, sign-off history) exports on demand. Audit history is append-only and cannot be edited or deleted, including by administrators.",
  },
  {
    area: "USPAP — supervision",
    detail:
      "Trainee reports are workflow-gated: the delivery package cannot be built until the assigned supervisory appraiser records approval. The gate is enforced by the platform, not by policy.",
  },
  {
    area: "UAD 3.6 / MISMO 3.6",
    detail:
      "The report is modeled as the UAD 3.6 dataset; the dynamic URAR layout derives from subject and assignment characteristics. Delivery output is a UCDP-ready package: MISMO 3.6 XML, human-readable PDF, and the image folder.",
  },
  {
    area: "ANSI Z765-2021",
    detail:
      "GLA is above-grade finished area; below-grade area is reported separately. The QC engine blocks export when sketch totals and reported GLA disagree.",
  },
  {
    area: "Quality control",
    detail:
      "A deterministic rules engine (not a model) evaluates required fields, comp guidelines (distance, sale age, GLA delta, net/gross/line adjustment thresholds), value bracketing, and photo evidence on every edit. Rules are versioned in code and change only through reviewed releases.",
  },
  {
    area: "Data handling",
    detail:
      "Report data is confidential and tenant-isolated. Customer reports are never used to train models and never pooled into cross-customer analytics. AI calls transmit only the minimal structured slice required for the requested draft.",
  },
  {
    area: "Security roadmap",
    detail:
      "Single-tenant data isolation and role-based access today; SOC 2 Type II program, SSO/SAML, and customer-managed retention policies on the enterprise roadmap.",
  },
];

export default function CompliancePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Compliance posture</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
        Written for the people who have to sign off on us: chief appraisers, compliance officers, and
        AMC vendor managers. Every statement below is implemented behavior, not intention.
      </p>
      <div className="mt-10 overflow-hidden rounded-lg border border-zinc-200">
        {ROWS.map((r, i) => (
          <div key={r.area} className={`grid gap-2 px-4 py-4 md:grid-cols-[220px_1fr] ${i % 2 ? "bg-zinc-50/60" : "bg-white"}`}>
            <div className="text-sm font-semibold text-zinc-800">{r.area}</div>
            <div className="text-sm leading-6 text-zinc-600">{r.detail}</div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-xs leading-5 text-zinc-400">
        Aivre reduces revision risk; it does not guarantee compliance outcomes. The signing appraiser
        remains solely responsible for the appraisal under USPAP.
      </p>
    </div>
  );
}
