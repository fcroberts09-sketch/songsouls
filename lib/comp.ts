/**
 * Sales-comparison math. All pure functions — the comp grid and QC panel
 * recompute these synchronously on every edit (no spinners on local edits).
 */
import { GUIDELINES } from "@/lib/uad/fields";
import type { AppraisalReport, Comparable } from "@/lib/types";
import { monthsBetween } from "@/lib/format";

/** Grid rows / adjustable attributes, in URAR grid order. */
export interface AdjustmentAttributeDef {
  key: string;
  label: string;
  /** Render the comp's raw value for this row. */
  compValue: (c: Comparable) => string | number;
  /** Render the subject's value for this row (from the report). */
  subjectValue: (r: AppraisalReport) => string | number;
  adjustable: boolean;
}

function baths(full: number, half: number): string {
  return `${full}.${half}`;
}

export const ADJUSTMENT_ATTRIBUTES: AdjustmentAttributeDef[] = [
  {
    key: "concessions",
    label: "Sale concessions",
    compValue: (c) => (c.concessions ? `$${c.concessions.toLocaleString()}` : "None"),
    subjectValue: () => "—",
    adjustable: true,
  },
  {
    key: "marketConditions",
    label: "Date of sale / time",
    compValue: (c) => c.saleDate.slice(0, 10),
    subjectValue: (r) => r.assignment.effectiveDate?.slice(0, 10) ?? "—",
    adjustable: true,
  },
  {
    key: "location",
    label: "Location",
    compValue: (c) => c.locationRating,
    subjectValue: () => "Neutral",
    adjustable: true,
  },
  {
    key: "site",
    label: "Site (sq ft)",
    compValue: (c) => c.siteSqFt.toLocaleString(),
    subjectValue: (r) => r.subject.lotSizeSqFt.value?.toLocaleString() ?? "—",
    adjustable: true,
  },
  {
    key: "view",
    label: "View",
    compValue: (c) => c.view,
    subjectValue: (r) => r.subject.view.value ?? "—",
    adjustable: true,
  },
  {
    key: "design",
    label: "Design (style)",
    compValue: (c) => c.design,
    subjectValue: (r) => r.subject.design.value ?? "—",
    adjustable: true,
  },
  {
    key: "quality",
    label: "Quality of construction",
    compValue: (c) => c.quality,
    subjectValue: (r) => r.subject.quality.value ?? "—",
    adjustable: true,
  },
  {
    key: "age",
    label: "Actual age",
    compValue: (c) => c.yearBuilt,
    subjectValue: (r) => r.subject.yearBuilt.value ?? "—",
    adjustable: true,
  },
  {
    key: "condition",
    label: "Condition",
    compValue: (c) => c.condition,
    subjectValue: (r) => r.subject.condition.value ?? "—",
    adjustable: true,
  },
  {
    key: "roomCount",
    label: "Rooms (Tot / Bd / Ba)",
    compValue: (c) => `${c.roomCount} / ${c.bedrooms} / ${baths(c.bathsFull, c.bathsHalf)}`,
    subjectValue: (r) =>
      `${r.subject.roomCount.value ?? "—"} / ${r.subject.bedrooms.value ?? "—"} / ${baths(
        r.subject.bathsFull.value ?? 0,
        r.subject.bathsHalf.value ?? 0,
      )}`,
    adjustable: true,
  },
  {
    key: "gla",
    label: "GLA (sq ft, ANSI)",
    compValue: (c) => c.gla.toLocaleString(),
    subjectValue: (r) => r.subject.gla.value?.toLocaleString() ?? "—",
    adjustable: true,
  },
  {
    key: "basement",
    label: "Basement & finish",
    compValue: (c) =>
      c.basementSqFt > 0
        ? `${c.basementSqFt.toLocaleString()} sf / ${c.basementFinishedSqFt.toLocaleString()} fin`
        : "None",
    subjectValue: (r) => {
      const total = r.subject.belowGradeSqFt.value ?? 0;
      const fin = r.subject.belowGradeFinishedSqFt.value ?? 0;
      return total > 0 ? `${total.toLocaleString()} sf / ${fin.toLocaleString()} fin` : "None";
    },
    adjustable: true,
  },
  {
    key: "garage",
    label: "Garage / carport",
    compValue: (c) => (c.garageSpaces > 0 ? `${c.garageSpaces}-car` : "None"),
    subjectValue: (r) => {
      const g = r.subject.garageSpaces.value ?? 0;
      return g > 0 ? `${g}-car` : "None";
    },
    adjustable: true,
  },
];

export function attributeLabel(key: string): string {
  return ADJUSTMENT_ATTRIBUTES.find((a) => a.key === key)?.label ?? key;
}

// ---------------------------------------------------------------- comp math

export interface CompComputed {
  netAdjustment: number;
  grossAdjustment: number;
  netPct: number; // signed, vs sale price
  grossPct: number;
  adjustedPrice: number;
  flags: CompFlag[];
}

export interface CompFlag {
  code:
    | "distance"
    | "saleAge"
    | "glaDelta"
    | "netOver"
    | "grossOver"
    | "lineOver"
    | "notSettled";
  message: string;
}

export function computeComp(report: AppraisalReport, comp: Comparable): CompComputed {
  const net = comp.adjustments.reduce((s, a) => s + a.amount, 0);
  const gross = comp.adjustments.reduce((s, a) => s + Math.abs(a.amount), 0);
  const netPct = comp.salePrice > 0 ? net / comp.salePrice : 0;
  const grossPct = comp.salePrice > 0 ? gross / comp.salePrice : 0;

  const flags: CompFlag[] = [];
  if (comp.distanceMiles > GUIDELINES.maxCompDistanceMiles) {
    flags.push({
      code: "distance",
      message: `${comp.distanceMiles.toFixed(2)} mi from subject (guideline ≤ ${GUIDELINES.maxCompDistanceMiles} mi)`,
    });
  }
  const eff = report.assignment.effectiveDate;
  if (eff && comp.status === "Settled") {
    const age = monthsBetween(comp.saleDate, eff);
    if (age > GUIDELINES.maxCompAgeMonths) {
      flags.push({
        code: "saleAge",
        message: `Sale is ${Math.round(age)} months old (guideline ≤ ${GUIDELINES.maxCompAgeMonths})`,
      });
    }
  }
  const subjGla = report.subject.gla.value;
  if (subjGla && subjGla > 0) {
    const delta = Math.abs(comp.gla - subjGla) / subjGla;
    if (delta > GUIDELINES.maxGlaDeltaPct) {
      flags.push({
        code: "glaDelta",
        message: `GLA differs ${(delta * 100).toFixed(0)}% from subject (guideline ≤ ${GUIDELINES.maxGlaDeltaPct * 100}%)`,
      });
    }
  }
  if (Math.abs(netPct) > GUIDELINES.maxNetAdjustmentPct) {
    flags.push({
      code: "netOver",
      message: `Net adjustment ${(netPct * 100).toFixed(1)}% (guideline ≤ ±${GUIDELINES.maxNetAdjustmentPct * 100}%)`,
    });
  }
  if (grossPct > GUIDELINES.maxGrossAdjustmentPct) {
    flags.push({
      code: "grossOver",
      message: `Gross adjustment ${(grossPct * 100).toFixed(1)}% (guideline ≤ ${GUIDELINES.maxGrossAdjustmentPct * 100}%)`,
    });
  }
  for (const a of comp.adjustments) {
    if (comp.salePrice > 0 && Math.abs(a.amount) / comp.salePrice > GUIDELINES.maxLineAdjustmentPct) {
      flags.push({
        code: "lineOver",
        message: `${attributeLabel(a.attribute)} adjustment exceeds ${GUIDELINES.maxLineAdjustmentPct * 100}% of sale price`,
      });
    }
  }

  return {
    netAdjustment: net,
    grossAdjustment: gross,
    netPct,
    grossPct,
    adjustedPrice: comp.salePrice + net,
    flags,
  };
}

/** Range of adjusted sale prices across settled comps. */
export function adjustedValueRange(report: AppraisalReport): { min: number; max: number } | null {
  const settled = report.comps.filter((c) => c.status === "Settled");
  if (settled.length === 0) return null;
  const prices = settled.map((c) => computeComp(report, c).adjustedPrice);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getAdjustment(comp: Comparable, attribute: string): number {
  return comp.adjustments.find((a) => a.attribute === attribute)?.amount ?? 0;
}
