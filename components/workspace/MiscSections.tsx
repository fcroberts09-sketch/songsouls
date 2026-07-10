"use client";
/** Assignment, ANSI sketch, reconciliation, and workfile/audit sections. */
import type { AppraisalReport } from "@/lib/types";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { adjustedValueRange } from "@/lib/comp";
import { exportService } from "@/lib/services";
import { fmtCurrency, fmtDate, fmtNumber } from "@/lib/format";
import { Button } from "@/components/ui";

// ---------------------------------------------------------------- assignment

export function AssignmentSection({ report }: { report: AppraisalReport }) {
  const a = report.assignment;
  const setContractPrice = useAppStore((s) => s.setContractPrice);
  const setEffectiveDate = useAppStore((s) => s.setAssignmentEffectiveDate);

  return (
    <div className="grid max-w-3xl grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-2">
      <ReadOnly label="Client" value={`${a.client} (${a.clientType})`} />
      <ReadOnly label="Product (derived)" value={a.productVariant} hint="Derived from subject characteristics — dynamic URAR, no form switch" />
      <ReadOnly label="Intended use" value={a.intendedUse} />
      <ReadOnly label="Intended user" value={a.intendedUser} />
      <ReadOnly label="Assignment type" value={a.assignmentType} />
      <ReadOnly label="Due date" value={fmtDate(a.dueDate)} />
      <div id="field-effectiveDate" className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-600">
          Effective date of value <span className="text-red-600">*</span>
        </label>
        <input
          type="date"
          value={a.effectiveDate ? a.effectiveDate.slice(0, 10) : ""}
          onChange={(e) => e.target.value && setEffectiveDate(report.orderId, new Date(e.target.value + "T12:00:00").toISOString())}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        />
      </div>
      {a.assignmentType === "Purchase" && (
        <div id="field-contractPrice" className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-600">
            Contract price <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            value={a.contractPrice ?? ""}
            onChange={(e) => setContractPrice(report.orderId, e.target.value === "" ? null : Number(e.target.value))}
            className="num rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          />
        </div>
      )}
    </div>
  );
}

function ReadOnly({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <span className="text-sm text-zinc-800">{value}</span>
      {hint && <span className="text-[11px] text-zinc-400">{hint}</span>}
    </div>
  );
}

// ---------------------------------------------------------------- sketch (ANSI)

export function SketchSection({ report }: { report: AppraisalReport }) {
  const sketch = report.subject.sketch;
  const setSketchLevel = useAppStore((s) => s.setSketchLevel);
  const setSketchNotes = useAppStore((s) => s.setSketchNotes);
  const above = sketch.levels.filter((l) => !l.belowGrade).reduce((s, l) => s + l.areaSqFt, 0);
  const below = sketch.levels.filter((l) => l.belowGrade).reduce((s, l) => s + l.areaSqFt, 0);
  const gridGla = report.subject.gla.value;
  const mismatch = gridGla != null && above > 0 && Math.abs(above - gridGla) > 1;

  return (
    <div className="max-w-3xl">
      <p className="mb-3 text-xs text-zinc-500">
        Measurement standard: <b>{sketch.standard}</b>. Above-grade finished area defines GLA; below-grade
        areas are reported separately. The reported GLA must match this sketch summary.
      </p>
      <table className="w-full max-w-xl text-sm" id="field-gla">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wide text-zinc-500">
            <th className="py-1.5 pr-3">Level</th>
            <th className="py-1.5 pr-3">Area (sq ft)</th>
            <th className="py-1.5">Grade</th>
          </tr>
        </thead>
        <tbody>
          {sketch.levels.map((l, i) => (
            <tr key={i} className="border-b border-zinc-100">
              <td className="py-1.5 pr-3">{l.name}</td>
              <td className="py-1.5 pr-3">
                <input
                  type="number"
                  value={l.areaSqFt}
                  onChange={(e) => setSketchLevel(report.orderId, i, Number(e.target.value))}
                  className="num w-28 rounded border border-zinc-300 px-2 py-1 text-sm"
                />
              </td>
              <td className="py-1.5 text-xs text-zinc-500">{l.belowGrade ? "Below grade" : "Above grade"}</td>
            </tr>
          ))}
          {sketch.levels.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-zinc-400">No sketch levels captured yet.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className={`mt-3 rounded-md border p-3 text-sm ${mismatch ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white"}`}>
        <div className="num">Sketch GLA (above grade): <b>{fmtNumber(above)} sf</b> · Below grade: {fmtNumber(below)} sf</div>
        <div className="num">Grid GLA: <b>{gridGla != null ? `${fmtNumber(gridGla)} sf` : "—"}</b></div>
        {mismatch && (
          <div className="mt-1 text-xs font-medium text-red-700">
            ANSI inconsistency — sketch and grid GLA must reconcile before export.
          </div>
        )}
      </div>
      <div className="mt-3">
        <label className="text-xs font-medium text-zinc-600">Sketch notes</label>
        <textarea
          value={sketch.notes}
          onChange={(e) => setSketchNotes(report.orderId, e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- reconciliation

export function ReconciliationSection({ report }: { report: AppraisalReport }) {
  const setRecon = useAppStore((s) => s.setReconciliation);
  const range = adjustedValueRange(report);
  const final = report.reconciliation.finalValueOpinion.value;
  const outside = range && final != null && (final < range.min || final > range.max);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-md border border-zinc-200 bg-white p-3 text-sm">
        <div className="text-xs font-medium text-zinc-500">Adjusted sale price range (settled comps)</div>
        <div className="num mt-0.5 text-lg font-semibold">
          {range ? `${fmtCurrency(range.min)} — ${fmtCurrency(range.max)}` : "No settled comps yet"}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CurrencyField
          id="field-indicatedValueSalesComparison"
          label="Indicated value — sales comparison"
          value={report.reconciliation.indicatedValueSalesComparison.value}
          onCommit={(v) => setRecon(report.orderId, "indicatedValueSalesComparison", v)}
        />
        <CurrencyField
          id="field-finalValueOpinion"
          label="Final opinion of market value *"
          value={final}
          onCommit={(v) => setRecon(report.orderId, "finalValueOpinion", v)}
          warn={outside ? "Outside the adjusted comp range — expect a revision request unless explained in commentary." : undefined}
        />
      </div>
      <p className="text-[11px] leading-4 text-zinc-400">
        The value opinion is yours alone — the assistant never sets or alters it. Draft supporting narrative
        from the Commentary section ("Reconciliation").
      </p>
    </div>
  );
}

function CurrencyField({
  id,
  label,
  value,
  onCommit,
  warn,
}: {
  id: string;
  label: string;
  value: number | null;
  onCommit: (v: number | null) => void;
  warn?: string;
}) {
  return (
    <div id={id} className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600">{label}</label>
      <input
        type="number"
        defaultValue={value ?? ""}
        onBlur={(e) => onCommit(e.target.value === "" ? null : Number(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={`num rounded-md border px-2 py-1.5 text-sm ${warn ? "border-amber-400 bg-amber-50" : "border-zinc-300 bg-white"}`}
      />
      {warn && <span className="text-[11px] text-amber-700">{warn}</span>}
    </div>
  );
}

// ---------------------------------------------------------------- workfile / audit

export function WorkfileSection({ report }: { report: AppraisalReport }) {
  const user = useCurrentUser();

  function exportWorkfile() {
    // USPAP workfile retention — full dataset + append-only audit trail.
    const json = exportService.buildWorkfile(report);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workfile-${report.orderId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Append-only audit trail — every autofill, AI accept/reject, and edit is recorded. Nothing is silently
          overwritten.
        </p>
        <Button onClick={exportWorkfile} title={`Export as ${user.name}`}>Export workfile (JSON)</Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Who</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {[...report.audit].reverse().map((e) => (
              <tr key={e.id} className="border-b border-zinc-100 last:border-0">
                <td className="num whitespace-nowrap px-3 py-1.5 text-zinc-500" suppressHydrationWarning>
                  {new Date(e.timestamp).toLocaleString()}
                </td>
                <td className="px-3 py-1.5">{e.actorName}</td>
                <td className="px-3 py-1.5">{e.action}</td>
                <td className="px-3 py-1.5 text-zinc-500">{e.target ?? ""}</td>
                <td className="px-3 py-1.5 text-zinc-500">
                  {e.before != null || e.after != null ? `${e.before ?? ""} → ${e.after ?? ""}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
