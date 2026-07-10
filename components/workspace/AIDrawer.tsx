"use client";
/**
 * Context-aware AI assistant drawer. Lists pending suggestions, answers
 * "is this assignment compliant?", and shows QC-issue explanations.
 * It cites the fields it used and never writes a value the data doesn't support.
 */
import { useState } from "react";
import type { AppraisalReport, QCIssue } from "@/lib/types";
import { llmService } from "@/lib/services";
import { Button, Spinner } from "@/components/ui";
import { SuggestionCard } from "./SuggestionCard";

export function AIDrawer({
  report,
  issues,
  explainText,
  onClose,
}: {
  report: AppraisalReport;
  issues: QCIssue[];
  explainText: string | null;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = report.suggestions.filter((s) => s.status === "pending");

  async function askCompliance() {
    // // SEAM: llmService — stateless call with the report slice + live QC.
    setBusy(true);
    try {
      setAnswer(await llmService.answerCompliance(report, issues));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-t border-zinc-200 bg-violet-50/30">
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-700">AI assistant</h2>
        <button onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-700">Close</button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {explainText && (
          <div className="rounded-md border border-violet-200 bg-white p-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">Why this issue fired</h3>
            <p className="mt-1 text-xs leading-4 text-zinc-700">{explainText}</p>
          </div>
        )}

        <div>
          <Button variant="secondary" onClick={askCompliance} disabled={busy} className="w-full">
            Is this assignment compliant?
          </Button>
          {busy && <div className="mt-2"><Spinner label="Checking against live QC…" /></div>}
          {answer && !busy && (
            <div className="mt-2 whitespace-pre-wrap rounded-md border border-zinc-200 bg-white p-2.5 text-xs leading-4 text-zinc-700">
              {answer}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Pending suggestions ({pending.length})
          </h3>
          {pending.length === 0 ? (
            <p className="text-xs text-zinc-400">
              Nothing pending. Generate suggestions from the Adjustments, Commentary, or Photos sections.
            </p>
          ) : (
            <div className="space-y-2">
              {pending.map((s) => (
                <SuggestionCard key={s.id} orderId={report.orderId} suggestion={s} />
              ))}
            </div>
          )}
        </div>

        <p className="text-[10px] leading-4 text-zinc-400">
          The assistant drafts and flags from the report's structured data only — it never sets or alters the
          opinion of value, adjustments, or ratings without your explicit accept.
        </p>
      </div>
    </div>
  );
}
