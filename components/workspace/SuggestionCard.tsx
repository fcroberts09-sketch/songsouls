"use client";
/**
 * The one-click accept/reject surface for every AI-originated value.
 * Nothing an AI produces lands in a field until this card is accepted;
 * accepts/rejects are audited.
 */
import type { AISuggestion } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui";

export function SuggestionCard({ orderId, suggestion, compact }: { orderId: string; suggestion: AISuggestion; compact?: boolean }) {
  const accept = useAppStore((s) => s.acceptSuggestion);
  const reject = useAppStore((s) => s.rejectSuggestion);
  const pending = suggestion.status === "pending";

  return (
    <div
      className={`rounded-md border p-2.5 ${
        pending
          ? "border-violet-200 bg-violet-50/60"
          : suggestion.status === "accepted"
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-zinc-200 bg-zinc-50 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-violet-100 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-violet-700">
              AI suggestion
            </span>
            <span className="text-xs font-semibold text-zinc-800">{suggestion.label}</span>
            <span className="num text-xs font-bold text-violet-800">{suggestion.display}</span>
            {!pending && (
              <span className="text-[10px] font-medium uppercase text-zinc-400">{suggestion.status}</span>
            )}
          </div>
          {!compact && <p className="mt-1 text-[11px] leading-4 text-zinc-600">{suggestion.rationale}</p>}
          <p className="mt-0.5 truncate text-[10px] text-zinc-400" title={suggestion.sourcesUsed.join(", ")}>
            Sources: {suggestion.sourcesUsed.join(", ")}
          </p>
        </div>
        {pending && (
          <div className="flex shrink-0 gap-1">
            <Button variant="primary" onClick={() => accept(orderId, suggestion.id)} title="Accept (writes value, audited)">
              Accept
            </Button>
            <Button variant="ghost" onClick={() => reject(orderId, suggestion.id)} title="Reject">
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
