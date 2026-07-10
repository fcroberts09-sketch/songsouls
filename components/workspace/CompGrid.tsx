"use client";
/**
 * Sales-comparison grid. Subject first, comps across, UAD attributes down,
 * inline adjustment cells. Everything recomputes synchronously on edit —
 * no spinners on local edits. Keyboard: Enter commits & moves down,
 * Shift+Enter up, Ctrl+Arrows move between cells.
 */
import { useRef, useState } from "react";
import type { AppraisalReport, Comparable, CompCandidate } from "@/lib/types";
import { ADJUSTMENT_ATTRIBUTES, computeComp, getAdjustment } from "@/lib/comp";
import { GUIDELINES } from "@/lib/uad/fields";
import { useAppStore } from "@/lib/store";
import { compService } from "@/lib/services";
import { fmtCurrency, fmtDate, fmtPct, fmtSignedCurrency } from "@/lib/format";
import { Button, ProvenanceChip, Spinner } from "@/components/ui";

export function CompGridSection({ report }: { report: AppraisalReport }) {
  const removeComp = useAppStore((s) => s.removeComp);
  const addComp = useAppStore((s) => s.addComp);
  const [candidates, setCandidates] = useState<CompCandidate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const gridRef = useRef<HTMLTableElement>(null);

  async function findComps() {
    // // SEAM: compService — ranked candidates; the appraiser decides what
    // enters the grid. Nothing is added automatically.
    setSearching(true);
    try {
      setCandidates(await compService.searchComps(report));
    } finally {
      setSearching(false);
    }
  }

  /** Ctrl+Arrow / Enter navigation across adjustment inputs. */
  function onGridKeyDown(e: React.KeyboardEvent) {
    const t = e.target as HTMLElement;
    const r = Number(t.dataset.r);
    const c = Number(t.dataset.c);
    if (Number.isNaN(r) || Number.isNaN(c)) return;
    let dr = 0;
    let dc = 0;
    if (e.key === "Enter") dr = e.shiftKey ? -1 : 1;
    else if (e.ctrlKey && e.key === "ArrowDown") dr = 1;
    else if (e.ctrlKey && e.key === "ArrowUp") dr = -1;
    else if (e.ctrlKey && e.key === "ArrowRight") dc = 1;
    else if (e.ctrlKey && e.key === "ArrowLeft") dc = -1;
    else return;
    const next = gridRef.current?.querySelector<HTMLInputElement>(
      `input[data-r="${r + dr}"][data-c="${c + dc}"]`,
    );
    if (next) {
      e.preventDefault();
      next.focus();
      next.select();
    }
  }

  const subjGla = report.subject.gla.value;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Button onClick={findComps} disabled={searching} variant="primary">
          Find comps
        </Button>
        {searching && <Spinner label="Searching comp service…" />}
        <span className="ml-auto text-[11px] text-zinc-400">
          Enter commits + moves down · Ctrl+arrows move between cells
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table ref={gridRef} onKeyDown={onGridKeyDown} className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="sticky left-0 z-10 w-44 min-w-44 bg-zinc-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Attribute
              </th>
              <th className="min-w-44 border-l border-zinc-200 px-3 py-2 text-left">
                <div className="text-xs font-semibold text-zinc-800">Subject</div>
                <div className="truncate text-[11px] font-normal text-zinc-500">
                  {report.subject.address.value ?? "—"}
                </div>
              </th>
              {report.comps.map((c, i) => {
                const computed = computeComp(report, c);
                return (
                  <th key={c.id} className="min-w-56 border-l border-zinc-200 px-3 py-2 text-left align-top">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="text-xs font-semibold text-zinc-800">Comp {i + 1}</div>
                        <div className="max-w-44 truncate text-[11px] font-normal text-zinc-500" title={c.address}>
                          {c.address}
                        </div>
                      </div>
                      <button
                        onClick={() => removeComp(report.orderId, c.id)}
                        title="Remove comparable"
                        className="rounded px-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                    {computed.flags.length > 0 && (
                      <div
                        className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
                        title={computed.flags.map((f) => f.message).join("\n")}
                      >
                        ⚑ {computed.flags.length} guideline flag{computed.flags.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* identity rows */}
            <IdentityRow label="Data source" subject="Inspection">
              {report.comps.map((c) => (
                <td key={c.id} className="border-l border-zinc-100 px-3 py-1.5">
                  <ProvenanceChip provenance={c.provenance} />
                </td>
              ))}
            </IdentityRow>
            <IdentityRow label="Proximity" subject="—">
              {report.comps.map((c) => (
                <td key={c.id} className={`num border-l border-zinc-100 px-3 py-1.5 ${c.distanceMiles > GUIDELINES.maxCompDistanceMiles ? "font-medium text-amber-700" : ""}`}>
                  {c.distanceMiles.toFixed(2)} mi
                </td>
              ))}
            </IdentityRow>
            <IdentityRow label="Status / sale date" subject="—">
              {report.comps.map((c) => (
                <td key={c.id} className="num border-l border-zinc-100 px-3 py-1.5">
                  {c.status} · {fmtDate(c.saleDate)}
                </td>
              ))}
            </IdentityRow>
            <IdentityRow
              label="Sale price"
              subject={report.assignment.contractPrice != null ? `${fmtCurrency(report.assignment.contractPrice)} (contract)` : "—"}
            >
              {report.comps.map((c) => (
                <td key={c.id} className="num border-l border-zinc-100 px-3 py-1.5 font-semibold">
                  {fmtCurrency(c.salePrice)}
                </td>
              ))}
            </IdentityRow>
            <IdentityRow label="Price / GLA" subject={subjGla ? "—" : "—"}>
              {report.comps.map((c) => (
                <td key={c.id} className="num border-l border-zinc-100 px-3 py-1.5 text-zinc-500">
                  {c.gla > 0 ? `$${Math.round(c.salePrice / c.gla)}/sf` : "—"}
                </td>
              ))}
            </IdentityRow>

            {/* adjustable attribute rows */}
            {ADJUSTMENT_ATTRIBUTES.map((attr, r) => (
              <tr key={attr.key} id={`field-${attr.key}`} className="border-t border-zinc-100">
                <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">
                  {attr.label}
                </td>
                <td className="border-l border-zinc-100 px-3 py-1.5">{attr.subjectValue(report)}</td>
                {report.comps.map((c, ci) => (
                  <td key={c.id} className="border-l border-zinc-100 px-2 py-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-zinc-700">{attr.compValue(c)}</span>
                      <AdjCell report={report} comp={c} attribute={attr.key} row={r} col={ci} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}

            {/* totals */}
            <TotalsRow label="Net adjustment" report={report} render={(x) => (
              <span className={`font-semibold ${Math.abs(x.netPct) > GUIDELINES.maxNetAdjustmentPct ? "text-amber-700" : ""}`}>
                {fmtSignedCurrency(x.netAdjustment)} <span className="font-normal text-zinc-400">({fmtPct(x.netPct)})</span>
              </span>
            )} />
            <TotalsRow label="Gross adjustment" report={report} render={(x) => (
              <span className={Math.abs(x.grossPct) > GUIDELINES.maxGrossAdjustmentPct ? "font-semibold text-amber-700" : "text-zinc-500"}>
                {fmtCurrency(x.grossAdjustment)} <span className="text-zinc-400">({fmtPct(x.grossPct)})</span>
              </span>
            )} />
            <TotalsRow label="Adjusted price" report={report} render={(x) => (
              <span className="text-sm font-bold text-zinc-900">{fmtCurrency(x.adjustedPrice)}</span>
            )} highlight />
          </tbody>
        </table>
        {report.comps.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-zinc-400">
            No comparables yet — run <b>Find comps</b> to pull ranked candidates.
          </div>
        )}
      </div>

      {candidates && (
        <CandidatePanel
          candidates={candidates}
          inGrid={new Set(report.comps.map((c) => c.id))}
          onAdd={(c) => addComp(report.orderId, c)}
          onClose={() => setCandidates(null)}
        />
      )}
    </div>
  );
}

function IdentityRow({ label, subject, children }: { label: string; subject: string; children: React.ReactNode }) {
  return (
    <tr className="border-t border-zinc-100">
      <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">{label}</td>
      <td className="border-l border-zinc-100 px-3 py-1.5 text-zinc-700">{subject}</td>
      {children}
    </tr>
  );
}

function TotalsRow({
  label,
  report,
  render,
  highlight,
}: {
  label: string;
  report: AppraisalReport;
  render: (x: ReturnType<typeof computeComp>) => React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <tr className={`border-t ${highlight ? "border-zinc-300 bg-zinc-50" : "border-zinc-200"}`}>
      <td className={`sticky left-0 z-10 px-3 py-2 text-xs font-semibold text-zinc-700 ${highlight ? "bg-zinc-50" : "bg-white"}`}>
        {label}
      </td>
      <td className="border-l border-zinc-100 px-3 py-2" />
      {report.comps.map((c) => (
        <td key={c.id} className="num border-l border-zinc-100 px-3 py-2">
          {render(computeComp(report, c))}
        </td>
      ))}
    </tr>
  );
}

/** Inline adjustment cell with draft state; commits on blur/Enter. */
function AdjCell({
  report,
  comp,
  attribute,
  row,
  col,
}: {
  report: AppraisalReport;
  comp: Comparable;
  attribute: string;
  row: number;
  col: number;
}) {
  const setAdjustment = useAppStore((s) => s.setAdjustment);
  const stored = getAdjustment(comp, attribute);
  const source = comp.adjustments.find((a) => a.attribute === attribute)?.source;
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const parsed = draft.trim() === "" ? 0 : Number(draft.replace(/[$,]/g, ""));
    if (!Number.isNaN(parsed) && parsed !== stored) {
      setAdjustment(report.orderId, comp.id, attribute, parsed);
    }
    setDraft(null);
  }

  const overLine =
    comp.salePrice > 0 && Math.abs(stored) / comp.salePrice > GUIDELINES.maxLineAdjustmentPct;

  return (
    <span className="relative inline-flex items-center">
      {source === "AI" && (
        <span
          className="absolute -left-4 text-[9px] font-bold text-violet-600"
          title="Adjustment originated from an accepted AI suggestion"
        >
          AI
        </span>
      )}
      <input
        data-r={row}
        data-c={col}
        inputMode="numeric"
        value={draft ?? (stored === 0 ? "" : String(stored))}
        placeholder="0"
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        className={`num w-20 rounded border px-1.5 py-1 text-right text-xs focus:border-indigo-400 focus:outline-none ${
          overLine
            ? "border-amber-400 bg-amber-50 text-amber-800"
            : stored !== 0
              ? "border-zinc-300 bg-white"
              : "border-zinc-200 bg-zinc-50 text-zinc-400"
        }`}
        title={overLine ? `Line adjustment exceeds ${GUIDELINES.maxLineAdjustmentPct * 100}% of sale price` : undefined}
      />
    </span>
  );
}

function CandidatePanel({
  candidates,
  inGrid,
  onAdd,
  onClose,
}: {
  candidates: CompCandidate[];
  inGrid: Set<string>;
  onAdd: (c: Comparable) => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-800">
          Ranked candidates <span className="font-normal text-zinc-400">· comp service (mock)</span>
        </h3>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {candidates.map(({ comp, score, rationale }) => {
          const added = inGrid.has(comp.id);
          return (
            <div key={comp.id} className="flex items-start justify-between gap-3 rounded-md border border-zinc-200 bg-white p-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`num rounded px-1.5 py-0.5 text-[11px] font-bold ${
                      score >= 80 ? "bg-emerald-50 text-emerald-700" : score >= 65 ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {score}
                  </span>
                  <span className="truncate text-sm font-medium">{comp.address}</span>
                </div>
                <div className="num mt-0.5 text-xs text-zinc-500">
                  {fmtCurrency(comp.salePrice)} · {comp.gla.toLocaleString()} sf · {comp.distanceMiles.toFixed(2)} mi ·{" "}
                  {comp.status} {fmtDate(comp.saleDate)}
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-400">{rationale}</div>
              </div>
              <Button variant={added ? "ghost" : "secondary"} disabled={added} onClick={() => onAdd(comp)}>
                {added ? "Added" : "Add"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
