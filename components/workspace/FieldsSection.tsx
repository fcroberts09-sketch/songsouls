"use client";
/**
 * Generic UAD field section renderer — driven entirely by the field registry,
 * so dynamic-URAR sections (condo project, manufactured, rent schedule…)
 * are configuration, not new screens. Every machine-populated field shows a
 * provenance chip and is overridable; overrides are audited, never silent.
 */
import { useEffect, useRef, useState } from "react";
import type { AppraisalReport, ConditionRating, QualityRating } from "@/lib/types";
import {
  CONDITION_DEFS,
  CONDITION_RATINGS,
  QUALITY_DEFS,
  QUALITY_RATINGS,
  fieldsForPropertyType,
  type SubjectFieldDef,
} from "@/lib/uad/fields";
import { useAppStore } from "@/lib/store";
import { dataService } from "@/lib/services";
import { Button, ProvenanceChip, Spinner } from "@/components/ui";

export function FieldsSection({
  report,
  sectionId,
  focusField,
}: {
  report: AppraisalReport;
  sectionId: string;
  focusField: string | null;
}) {
  const defs = fieldsForPropertyType(report.subject.propertyType).filter(
    (d) => d.sectionId === sectionId,
  );
  const [autofilling, setAutofilling] = useState(false);
  const setSubjectField = useAppStore((s) => s.setSubjectField);

  async function autofill() {
    // // SEAM: dataService — mock public-record pull. Every returned field
    // lands with provenance attached; the appraiser can override any of them.
    setAutofilling(true);
    try {
      const fields = await dataService.fetchPublicRecord(report.subject.address.value ?? "");
      for (const f of fields) {
        useAppStore.getState().setSubjectField(report.orderId, f.key, f.value, f.provenance.source);
      }
    } finally {
      setAutofilling(false);
    }
  }

  return (
    <div>
      {sectionId === "subject" && (
        <div className="mb-4 flex items-center gap-3">
          <Button onClick={autofill} disabled={autofilling} variant="secondary">
            Autofill from public record
          </Button>
          {autofilling && <Spinner label="Pulling county data…" />}
          <span className="text-xs text-zinc-400">
            Autofilled values arrive with a source chip; click any field to override.
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-8 gap-y-1 lg:grid-cols-2">
        {defs.map((def) => (
          <FieldRow
            key={def.key}
            report={report}
            def={def}
            focused={focusField === def.key}
            onChange={(v) => setSubjectField(report.orderId, def.key, v)}
          />
        ))}
      </div>
    </div>
  );
}

function FieldRow({
  report,
  def,
  focused,
  onChange,
}: {
  report: AppraisalReport;
  def: SubjectFieldDef;
  focused: boolean;
  onChange: (v: unknown) => void;
}) {
  const sourcedVal = report.subject[def.key];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({ block: "center", behavior: "smooth" });
      ref.current.classList.remove("field-flash");
      void ref.current.offsetWidth; // restart animation
      ref.current.classList.add("field-flash");
    }
  }, [focused]);

  const missing = def.required && (sourcedVal.value === null || sourcedVal.value === "");

  return (
    <div ref={ref} id={`field-${def.key}`} className="flex flex-col gap-1 border-b border-zinc-100 py-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-zinc-600">
          {def.label}
          {def.required && <span className={missing ? "ml-1 text-red-600" : "ml-1 text-zinc-300"}>*</span>}
        </label>
        <div className="flex items-center gap-1.5">
          {def.uadId && (
            <span className="hidden text-[10px] text-zinc-300 xl:inline" title="MISMO/UAD data point">
              {def.uadId}
            </span>
          )}
          <ProvenanceChip provenance={sourcedVal.provenance} />
        </div>
      </div>
      <FieldControl def={def} value={sourcedVal.value} onChange={onChange} />
      {def.help && <p className="text-[11px] text-zinc-400">{def.help}</p>}
    </div>
  );
}

function FieldControl({
  def,
  value,
  onChange,
}: {
  def: SubjectFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base =
    "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none";

  if (def.type === "condition" || def.type === "quality") {
    const ratings = def.type === "condition" ? CONDITION_RATINGS : QUALITY_RATINGS;
    const defs: Record<string, string> = def.type === "condition" ? CONDITION_DEFS : QUALITY_DEFS;
    const current = value as ConditionRating | QualityRating | null;
    return (
      <div>
        <div className="flex gap-1">
          {ratings.map((r) => (
            <button
              key={r}
              type="button"
              title={defs[r]}
              onClick={() => onChange(r)}
              className={`flex-1 rounded border px-1 py-1.5 text-xs font-semibold transition-colors ${
                current === r
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {current && <p className="mt-1 text-[11px] leading-4 text-zinc-500">{defs[current]}</p>}
      </div>
    );
  }

  if (def.type === "select") {
    return (
      <select className={base} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {def.options?.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  }

  if (def.type === "number" || def.type === "currency") {
    return (
      <input
        type="number"
        className={`${base} num`}
        value={(value as number) ?? ""}
        placeholder={def.type === "currency" ? "$" : ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    );
  }

  return (
    <input
      type="text"
      className={base}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
