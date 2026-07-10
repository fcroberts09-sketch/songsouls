"use client";
/**
 * Adjustments workspace: per-attribute support (basis + justification that
 * flows into commentary), per-comp amounts, and AI-suggested adjustments
 * that land strictly as pending suggestions.
 */
import { useState } from "react";
import type { AppraisalReport } from "@/lib/types";
import { ADJUSTMENT_ATTRIBUTES, getAdjustment } from "@/lib/comp";
import { useAppStore } from "@/lib/store";
import { llmService } from "@/lib/services";
import { fmtSignedCurrency } from "@/lib/format";
import { Button, Spinner } from "@/components/ui";
import { SuggestionCard } from "./SuggestionCard";

export function AdjustmentsSection({ report }: { report: AppraisalReport }) {
  const setBasis = useAppStore((s) => s.setAdjustmentBasis);
  const addSuggestions = useAppStore((s) => s.addSuggestions);
  const [busy, setBusy] = useState(false);

  async function suggest() {
    // // SEAM: llmService — suggestions land as pending objects only;
    // the appraiser accepts each one explicitly.
    setBusy(true);
    try {
      const suggestions = await llmService.suggestAdjustments(report);
      addSuggestions(report.orderId, suggestions);
    } finally {
      setBusy(false);
    }
  }

  const pendingAdj = report.suggestions.filter(
    (s) => s.status === "pending" && s.target.kind === "adjustment",
  );

  // attributes in play: any with a nonzero adjustment, a basis, or a pending suggestion
  const activeAttrs = ADJUSTMENT_ATTRIBUTES.filter(
    (a) =>
      report.comps.some((c) => getAdjustment(c, a.key) !== 0) ||
      report.adjustmentBases.some((b) => b.attribute === a.key) ||
      pendingAdj.some((s) => s.target.kind === "adjustment" && s.target.attribute === a.key),
  );

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={suggest} disabled={busy || report.comps.length === 0}>
          Suggest adjustments (AI)
        </Button>
        {busy && <Spinner label="Analyzing comp deltas…" />}
        <span className="text-[11px] text-zinc-400">
          Suggestions never write to the grid until you accept them.
        </span>
      </div>

      {pendingAdj.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Pending suggestions ({pendingAdj.length})
          </h3>
          {pendingAdj.map((s) => (
            <SuggestionCard key={s.id} orderId={report.orderId} suggestion={s} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Adjustment support
        </h3>
        {activeAttrs.length === 0 && (
          <p className="text-sm text-zinc-400">
            No adjustments yet — enter them in the comp grid or run the AI suggester.
          </p>
        )}
        {activeAttrs.map((attr) => {
          const basis = report.adjustmentBases.find((b) => b.attribute === attr.key);
          return (
            <div key={attr.key} id={`field-${attr.key}`} className="rounded-lg border border-zinc-200 bg-white p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-zinc-800">{attr.label}</h4>
                <div className="num flex gap-3 text-xs text-zinc-500">
                  {report.comps.map((c, i) => {
                    const amt = getAdjustment(c, attr.key);
                    return (
                      <span key={c.id}>
                        Comp {i + 1}: <b className={amt !== 0 ? "text-zinc-800" : ""}>{amt !== 0 ? fmtSignedCurrency(amt) : "—"}</b>
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-medium text-zinc-500">
                    Basis (paired-sales / market-derived)
                  </label>
                  <input
                    defaultValue={basis?.basis ?? ""}
                    placeholder='e.g. "$45/sf — market extraction, 6 paired sales"'
                    onBlur={(e) => setBasis(report.orderId, attr.key, e.target.value, basis?.justification ?? "")}
                    className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-500">
                    Justification (flows into commentary)
                  </label>
                  <input
                    defaultValue={basis?.justification ?? ""}
                    placeholder="One line of reasoning for the workfile and narrative"
                    onBlur={(e) => setBasis(report.orderId, attr.key, basis?.basis ?? "", e.target.value)}
                    className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1.5 text-xs"
                  />
                </div>
              </div>
              {basis?.source === "AI" && (
                <p className="mt-1 text-[10px] text-violet-600">Support text originated from an accepted AI suggestion.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
