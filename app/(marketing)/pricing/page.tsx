import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Per-seat pricing, unlimited reports. Start with the live demo — no card required.",
};

const TIERS = [
  {
    name: "Solo",
    price: "$89",
    unit: "/appraiser · month",
    blurb: "For independent fee appraisers.",
    features: [
      "Unlimited reports, every URAR variant",
      "Live compliance & QC engine",
      "AI commentary, adjustments & photo labeling",
      "Mobile inspection mode",
      "Workfile export (USPAP record keeping)",
    ],
    cta: "Start with the demo",
    highlight: false,
  },
  {
    name: "Team",
    price: "$79",
    unit: "/appraiser · month",
    blurb: "For shops with trainees and reviewers.",
    features: [
      "Everything in Solo",
      "Supervisor sign-off workflow (USPAP supervision)",
      "Roles: appraiser, trainee, supervisor, admin",
      "Org-wide order dashboard & assignment",
      "Priority support",
    ],
    cta: "Start with the demo",
    highlight: true,
  },
  {
    name: "Enterprise / AMC",
    price: "Let's talk",
    unit: "",
    blurb: "For AMCs and lender panels.",
    features: [
      "Everything in Team",
      "SSO / SAML, custom retention policies",
      "Delivery & portal integrations",
      "API access",
      "Volume pricing",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="text-center text-3xl font-bold tracking-tight">Simple, per-seat, unlimited reports</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-zinc-600">
        AI usage is pooled per organization with a generous fair-use allowance. Annual billing takes 15%
        off. And the demo is free forever — kick the tires first.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`rounded-xl border p-6 ${t.highlight ? "border-indigo-300 shadow-md ring-1 ring-indigo-200" : "border-zinc-200"}`}
          >
            {t.highlight && (
              <div className="mb-2 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                Most popular
              </div>
            )}
            <h2 className="text-lg font-semibold">{t.name}</h2>
            <p className="text-xs text-zinc-500">{t.blurb}</p>
            <div className="mt-4">
              <span className="text-3xl font-bold">{t.price}</span>
              <span className="text-sm text-zinc-500"> {t.unit}</span>
            </div>
            <ul className="mt-5 space-y-2">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-zinc-700">
                  <span className="text-indigo-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/demo"
              className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold ${
                t.highlight
                  ? "bg-(--color-accent) text-white hover:bg-(--color-accent-hover)"
                  : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-xs text-zinc-400">
        Pricing shown is introductory and subject to change at general availability.
      </p>
    </div>
  );
}
