"use client";
/** Small shared UI primitives: status dots, severity badges, provenance chips. */
import type { Provenance, QCSeverity } from "@/lib/types";
import type { ComplianceHealth } from "@/lib/qc/rules";
import { relativeTime } from "@/lib/format";

export function StatusDot({ health, title }: { health: ComplianceHealth; title?: string }) {
  const color =
    health === "red" ? "bg-(--color-blocker)" : health === "amber" ? "bg-(--color-warning)" : "bg-(--color-ok)";
  return (
    <span
      title={title ?? { red: "Has blockers", amber: "Has warnings", green: "Clean" }[health]}
      className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}
    />
  );
}

export function SeverityBadge({ severity }: { severity: QCSeverity }) {
  const styles: Record<QCSeverity, string> = {
    Blocker: "bg-red-50 text-red-700 border-red-200",
    Warning: "bg-amber-50 text-amber-700 border-amber-200",
    Note: "bg-zinc-50 text-zinc-600 border-zinc-200",
  };
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${styles[severity]}`}>
      {severity}
    </span>
  );
}

const SOURCE_STYLES: Record<Provenance["source"], string> = {
  PublicRecord: "bg-sky-50 text-sky-800 border-sky-200",
  MLS: "bg-teal-50 text-teal-800 border-teal-200",
  AI: "bg-violet-50 text-violet-800 border-violet-200",
  Appraiser: "bg-zinc-100 text-zinc-700 border-zinc-300",
  Inspection: "bg-zinc-100 text-zinc-700 border-zinc-300",
};

const SOURCE_LABELS: Record<Provenance["source"], string> = {
  PublicRecord: "Public Record",
  MLS: "MLS",
  AI: "AI",
  Appraiser: "Appraiser",
  Inspection: "Inspection",
};

/**
 * The trust surface on every machine-populated value: where it came from,
 * when, and at what confidence.
 */
export function ProvenanceChip({ provenance }: { provenance: Provenance | null }) {
  if (!provenance) return null;
  const title = [
    `Source: ${SOURCE_LABELS[provenance.source]}`,
    provenance.detail,
    provenance.confidence != null ? `Confidence ${(provenance.confidence * 100).toFixed(0)}%` : null,
    new Date(provenance.timestamp).toLocaleString(),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <span
      title={title}
      suppressHydrationWarning
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[10px] leading-4 ${SOURCE_STYLES[provenance.source]}`}
    >
      {SOURCE_LABELS[provenance.source]} · {relativeTime(provenance.timestamp)}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "secondary",
  disabled,
  title,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  title?: string;
  className?: string;
  type?: "button" | "submit";
}) {
  const styles = {
    primary:
      "bg-(--color-accent) text-white hover:bg-(--color-accent-hover) disabled:bg-zinc-300 disabled:text-zinc-500",
    secondary:
      "bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-50 disabled:text-zinc-400",
    danger: "bg-white text-red-700 border border-red-300 hover:bg-red-50",
    ghost: "text-zinc-600 hover:bg-zinc-100",
  }[variant];
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-(--color-accent)" />
      {label}
    </span>
  );
}
