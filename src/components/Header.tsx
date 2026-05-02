"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { brand } from "@/lib/brand";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/songs", label: "Listen" },
    { href: "/manifesto", label: "Manifesto" },
    { href: "/#pricing", label: "Pricing" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-ink-950/80 backdrop-blur-xl border-b border-gold-700/15"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group min-h-[44px]">
          <Logo />
          <span className="font-display text-xl tracking-tight text-cream-100 group-hover:text-gold-200 transition-colors">
            {brand.name}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-cream-200/80 hover:text-gold-200 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/create"
            className="btn-primary text-sm"
          >
            Begin a song
          </Link>
        </nav>

        <button
          className="md:hidden -mr-2 p-3 text-cream-100 inline-flex items-center justify-center min-w-[44px] min-h-[44px]"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gold-700/15 bg-ink-950/95 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-cream-200/90 hover:text-gold-200 py-3 min-h-[44px] flex items-center"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/create"
              onClick={() => setOpen(false)}
              className="btn-primary w-full justify-center my-3"
            >
              Begin a song
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-700/30">
      <svg className="w-5 h-5 text-ink-950" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 18V5l12-2v13a3 3 0 1 1-2-2.83V6.34L11 8v10a3 3 0 1 1-2-2.83V18z" />
      </svg>
    </div>
  );
}
