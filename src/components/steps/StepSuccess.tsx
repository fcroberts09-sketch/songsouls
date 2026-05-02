"use client";

import Link from "next/link";

interface StepSuccessProps {
  orderId: string | null;
  recipientName: string;
  tierName: string;
  turnaround: string;
}

export default function StepSuccess(props: StepSuccessProps) {
  const { orderId, recipientName, tierName, turnaround } = props;
  return (
    <div className="max-w-2xl mx-auto text-center py-10">
      <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 flex items-center justify-center glow-warm">
        <svg className="w-10 h-10 text-ink-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="text-xs uppercase tracking-widest text-gold-400/80 mb-3">
        Payment received
      </div>
      <h2 className="font-display text-4xl md:text-5xl text-cream-100 mb-4">
        Your song is in our hands.
      </h2>

      <p className="text-cream-200/70 max-w-lg mx-auto mb-8 leading-relaxed">
        We&rsquo;ve received your <strong className="text-cream-100">{tierName}</strong> order for{" "}
        <strong className="text-cream-100">{recipientName}</strong>. You&rsquo;ll hear from us within{" "}
        <strong className="text-gold-300">{turnaround}</strong> with the finished song.
      </p>

      {orderId && (
        <div className="card-deep rounded-xl px-6 py-4 inline-block mb-8">
          <div className="text-xs text-cream-200/50 mb-1">Order ID</div>
          <div className="font-mono text-gold-200 text-lg">{orderId}</div>
        </div>
      )}

      <p className="text-sm text-cream-200/55 mb-8">
        Hold on to that ID — and feel free to reply to the confirmation email anytime.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/" className="btn-ghost">
          Back to home
        </Link>
        <Link href="/songs" className="btn-primary">
          Listen to other songs while you wait
        </Link>
      </div>
    </div>
  );
}
