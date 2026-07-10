import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Aivre — The AI-Native Appraisal Platform",
    template: "%s · Aivre",
  },
  description:
    "UAD 3.6-native appraisal software with live compliance QC and AI write-ups. The AI does the typing. You do the appraising.",
};

const NAV = [
  { href: "/product", label: "Product" },
  { href: "/ai", label: "AI & Trust" },
  { href: "/compliance", label: "Compliance" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
              Aivre
            </Link>
            <nav className="hidden gap-6 text-sm text-zinc-600 md:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-zinc-900">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Open the app
            </Link>
            <Link
              href="/demo"
              className="rounded-md bg-(--color-accent) px-3 py-1.5 text-sm font-medium text-white hover:bg-(--color-accent-hover)"
            >
              Try the live demo
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="text-sm font-bold">Aivre</div>
              <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">
                The AI does the typing. You do the appraising.
              </p>
            </div>
            <nav className="flex gap-6 text-xs text-zinc-500">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-zinc-800">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="mt-6 border-t border-zinc-200 pt-4 text-[11px] leading-5 text-zinc-400">
            Aivre reduces revision risk; it does not guarantee compliance outcomes. The signing appraiser
            remains solely responsible for the appraisal under USPAP. Aivre provides workflow software, not
            appraisal, legal, or USPAP advice. © 2026 Aivre.
          </p>
        </div>
      </footer>
    </div>
  );
}
