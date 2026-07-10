"use client";
/**
 * AI commentary: drafts are generated from structured data only, arrive as
 * pending suggestions with cited source fields, and only land in the block
 * when accepted. Human edits always win and re-stamp provenance.
 */
import { useState } from "react";
import type { AppraisalReport } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { llmService } from "@/lib/services";
import { uid } from "@/lib/format";
import { Button, ProvenanceChip, Spinner } from "@/components/ui";
import { SuggestionCard } from "./SuggestionCard";

export function CommentarySection({ report, focusField }: { report: AppraisalReport; focusField: string | null }) {
  return (
    <div className="max-w-3xl space-y-4">
      {report.commentary.map((block) => (
        <CommentaryBlockEditor key={block.id} report={report} blockId={block.id} highlight={focusField === block.id} />
      ))}
    </div>
  );
}

function CommentaryBlockEditor({
  report,
  blockId,
  highlight,
}: {
  report: AppraisalReport;
  blockId: string;
  highlight: boolean;
}) {
  const block = report.commentary.find((b) => b.id === blockId)!;
  const setCommentary = useAppStore((s) => s.setCommentary);
  const addSuggestions = useAppStore((s) => s.addSuggestions);
  const [busy, setBusy] = useState(false);

  const pendingDraft = report.suggestions.find(
    (s) => s.status === "pending" && s.target.kind === "commentary" && s.target.blockId === blockId,
  );

  async function draft() {
    // // SEAM: llmService — draft from structured fields; cited sources returned.
    setBusy(true);
    try {
      const result = await llmService.generateCommentary(report, blockId);
      addSuggestions(report.orderId, [
        {
          id: uid("sug"),
          target: { kind: "commentary", blockId },
          label: `${block.title} narrative`,
          value: result.text,
          display: result.text.length > 80 ? result.text.slice(0, 80) + "…" : result.text,
          rationale: result.text,
          sourcesUsed: result.sourcesUsed,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id={`field-${blockId}`} className={`rounded-lg border bg-white p-3 ${highlight ? "field-flash border-indigo-300" : "border-zinc-200"}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-800">{block.title}</h3>
        <div className="flex items-center gap-2">
          <ProvenanceChip provenance={block.provenance} />
          {busy ? <Spinner label="Drafting…" /> : (
            <Button onClick={draft} disabled={!!pendingDraft} title="Draft from the report's structured data">
              Draft with AI
            </Button>
          )}
        </div>
      </div>
      {pendingDraft && (
        <div className="mb-2">
          <SuggestionCard orderId={report.orderId} suggestion={pendingDraft} />
        </div>
      )}
      <textarea
        value={block.text}
        rows={block.text ? Math.min(8, Math.max(3, Math.ceil(block.text.length / 110))) : 3}
        placeholder={`No ${block.title.toLowerCase()} narrative yet — write it or draft with AI.`}
        onChange={(e) =>
          setCommentary(report.orderId, blockId, e.target.value, {
            source: "Appraiser",
            timestamp: new Date().toISOString(),
          })
        }
        className="w-full rounded-md border border-zinc-300 px-2.5 py-2 text-sm leading-5"
      />
    </div>
  );
}
