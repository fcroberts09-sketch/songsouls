import Link from "next/link";
import { brand } from "@/lib/brand";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-20 sm:mt-32 border-t border-gold-700/15 bg-ink-950/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid md:grid-cols-4 gap-8 sm:gap-10">
        <div className="md:col-span-2">
          <div className="font-display text-2xl text-cream-100 mb-3">{brand.name}</div>
          <p className="text-cream-200/60 max-w-sm leading-relaxed text-sm">
            {brand.description}
          </p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-gold-400/70 mb-4">
            Listen
          </div>
          <ul className="space-y-1 text-sm text-cream-200/70">
            <li><Link href="/songs" className="hover:text-gold-200 transition-colors block py-2">Song library</Link></li>
            <li><Link href="/manifesto" className="hover:text-gold-200 transition-colors block py-2">Why we exist</Link></li>
            <li><Link href="/#pricing" className="hover:text-gold-200 transition-colors block py-2">Pricing</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-gold-400/70 mb-4">
            Begin
          </div>
          <ul className="space-y-1 text-sm text-cream-200/70">
            <li><Link href="/create" className="hover:text-gold-200 transition-colors block py-2">Create a song</Link></li>
            <li><a href={`mailto:${brand.contact.email}`} className="hover:text-gold-200 transition-colors block py-2">Email us</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gold-700/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream-200/40 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
            <span>© {new Date().getFullYear()} {brand.name}. Made with care.</span>
            <span className="text-cream-200/25 hidden sm:inline">·</span>
            <Link href="/terms" className="hover:text-gold-200 transition-colors py-1">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-gold-200 transition-colors py-1">
              Privacy
            </Link>
          </div>
          <div className="font-display-italic text-cream-200/50">
            &ldquo;Songs are how the people we love stay close.&rdquo;
          </div>
        </div>
      </div>
    </footer>
  );
}
