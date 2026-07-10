/**
 * Live compliance & QC rules engine.
 *
 * Pure function over the report — derived state, recomputed on every edit.
 * Severities:
 *   Blocker — will fail UCDP / missing required UAD field. Blocks export.
 *   Warning — guideline risk likely to draw a revision request.
 *   Note    — advisory.
 */
import type { AppraisalReport, QCIssue, QCSeverity } from "@/lib/types";
import { fieldsForPropertyType, GUIDELINES } from "@/lib/uad/fields";
import { adjustedValueRange, computeComp } from "@/lib/comp";
import { fmtCurrency } from "@/lib/format";

let n = 0;
function issue(
  severity: QCSeverity,
  sectionId: string,
  message: string,
  opts: { field?: string; detail?: string } = {},
): QCIssue {
  n += 1;
  return { id: `qc_${n}`, severity, sectionId, message, ...opts };
}

export function runQC(report: AppraisalReport): QCIssue[] {
  n = 0;
  const issues: QCIssue[] = [];
  const { assignment, subject, comps, reconciliation } = report;

  // ---- required UAD fields (Blockers) — driven by the field registry
  for (const def of fieldsForPropertyType(subject.propertyType)) {
    if (!def.required) continue;
    const v = subject[def.key].value;
    if (v === null || v === "" || v === undefined) {
      issues.push(
        issue("Blocker", def.sectionId, `Missing required UAD field: ${def.label}`, {
          field: def.key,
          detail: def.uadId ? `MISMO data point ${def.uadId} is required for UCDP.` : undefined,
        }),
      );
    }
  }

  // ---- assignment-level blockers
  if (!assignment.effectiveDate) {
    issues.push(
      issue("Blocker", "assignment", "Missing effective date of value", {
        field: "effectiveDate",
        detail: "Set during inspection; required on every UAD report.",
      }),
    );
  }
  if (assignment.assignmentType === "Purchase" && assignment.contractPrice == null) {
    issues.push(
      issue("Blocker", "assignment", "Purchase assignment is missing the contract price", {
        field: "contractPrice",
      }),
    );
  }

  // ---- ANSI sketch consistency
  const sketchGla = report.subject.sketch.levels
    .filter((l) => !l.belowGrade)
    .reduce((s, l) => s + l.areaSqFt, 0);
  const gridGla = subject.gla.value;
  if (gridGla != null && sketchGla > 0 && Math.abs(sketchGla - gridGla) > 1) {
    issues.push(
      issue(
        "Blocker",
        "sketch",
        `GLA mismatch: sketch totals ${sketchGla.toLocaleString()} sf, grid shows ${gridGla.toLocaleString()} sf`,
        {
          field: "gla",
          detail:
            "ANSI Z765-2021 requires the reported GLA to be consistent with the measured sketch. Reconcile before export.",
        },
      ),
    );
  }
  const sketchBelow = report.subject.sketch.levels
    .filter((l) => l.belowGrade)
    .reduce((s, l) => s + l.areaSqFt, 0);
  const belowGrade = subject.belowGradeSqFt.value ?? 0;
  if (sketchBelow > 0 && Math.abs(sketchBelow - belowGrade) > 1) {
    issues.push(
      issue(
        "Warning",
        "sketch",
        `Below-grade area mismatch: sketch ${sketchBelow.toLocaleString()} sf vs ${belowGrade.toLocaleString()} sf reported`,
        { field: "belowGradeSqFt", detail: "ANSI: areas below grade are reported separately from GLA." },
      ),
    );
  }

  // ---- comparables
  const settled = comps.filter((c) => c.status === "Settled");
  if (settled.length < GUIDELINES.minClosedComps) {
    issues.push(
      issue(
        "Blocker",
        "comps",
        `Only ${settled.length} settled comparable${settled.length === 1 ? "" : "s"} — at least ${GUIDELINES.minClosedComps} required`,
      ),
    );
  }
  comps.forEach((c, i) => {
    const label = `Comp ${i + 1}`;
    const computed = computeComp(report, c);
    for (const f of computed.flags) {
      const sev: QCSeverity =
        f.code === "netOver" || f.code === "grossOver" || f.code === "lineOver"
          ? "Warning"
          : f.code === "notSettled"
            ? "Note"
            : "Warning";
      issues.push(issue(sev, "comps", `${label} (${c.address}): ${f.message}`, { field: c.id }));
    }
    const unexplained = c.adjustments.filter(
      (a) =>
        a.amount !== 0 &&
        !report.adjustmentBases.some((b) => b.attribute === a.attribute && b.justification.trim() !== ""),
    );
    if (unexplained.length > 0) {
      issues.push(
        issue(
          "Note",
          "adjustments",
          `${label}: ${unexplained.length} adjustment${unexplained.length === 1 ? "" : "s"} without documented support`,
          { field: unexplained[0].attribute, detail: "Add a basis/justification in the Adjustments workspace; it flows into commentary." },
        ),
      );
    }
  });

  // ---- reconciliation
  const finalValue = reconciliation.finalValueOpinion.value;
  if (finalValue == null) {
    issues.push(
      issue("Blocker", "reconciliation", "Missing final opinion of value", { field: "finalValueOpinion" }),
    );
  } else {
    const range = adjustedValueRange(report);
    if (range && (finalValue < range.min || finalValue > range.max)) {
      issues.push(
        issue(
          "Warning",
          "reconciliation",
          `Value opinion ${fmtCurrency(finalValue)} is outside the adjusted comp range (${fmtCurrency(range.min)}–${fmtCurrency(range.max)})`,
          { field: "finalValueOpinion", detail: "Unbracketed value opinions commonly draw UCDP revision requests." },
        ),
      );
    }
    if (
      assignment.assignmentType === "Purchase" &&
      assignment.contractPrice != null &&
      finalValue < assignment.contractPrice
    ) {
      issues.push(
        issue(
          "Note",
          "reconciliation",
          `Value opinion is below the contract price (${fmtCurrency(assignment.contractPrice)}) — ensure reconciliation commentary addresses it`,
          { field: "finalValueOpinion" },
        ),
      );
    }
  }

  // ---- photos
  if (report.photos.length < GUIDELINES.minPhotos) {
    issues.push(
      issue(
        "Warning",
        "photos",
        `Only ${report.photos.length} photo${report.photos.length === 1 ? "" : "s"} attached (minimum ${GUIDELINES.minPhotos} for the UCDP package)`,
      ),
    );
  }
  for (const kind of ["subject-front", "subject-rear", "subject-street"] as const) {
    if (!report.photos.some((p) => p.kind === kind)) {
      issues.push(
        issue("Warning", "photos", `Missing required photo: ${kind.replace("subject-", "subject ")}`),
      );
    }
  }
  const cond = subject.condition.value;
  if ((cond === "C5" || cond === "C6") && !report.photos.some((p) => p.kind === "deficiency")) {
    issues.push(
      issue(
        "Warning",
        "photos",
        `Condition ${cond} reported but no deficiency photos attached — the rating must be supported by photos`,
        { field: "condition" },
      ),
    );
  }

  // ---- commentary
  for (const block of report.commentary) {
    if (block.text.trim() === "") {
      issues.push(
        issue("Note", "commentary", `${block.title} commentary is empty`, { field: block.id }),
      );
    }
  }

  return issues;
}

// ---------------------------------------------------------------- derived rollups

export function qcCounts(issues: QCIssue[]): { blockers: number; warnings: number; notes: number } {
  return {
    blockers: issues.filter((i) => i.severity === "Blocker").length,
    warnings: issues.filter((i) => i.severity === "Warning").length,
    notes: issues.filter((i) => i.severity === "Note").length,
  };
}

export type ComplianceHealth = "red" | "amber" | "green";

export function complianceHealth(issues: QCIssue[]): ComplianceHealth {
  const c = qcCounts(issues);
  if (c.blockers > 0) return "red";
  if (c.warnings > 0) return "amber";
  return "green";
}

/** Report completeness: share of required UAD fields + key milestones present. */
export function completenessPct(report: AppraisalReport): number {
  const defs = fieldsForPropertyType(report.subject.propertyType).filter((d) => d.required);
  let total = defs.length;
  let done = 0;
  for (const def of defs) {
    const v = report.subject[def.key].value;
    if (v !== null && v !== "" && v !== undefined) done += 1;
  }
  // milestones: effective date, ≥3 settled comps, final value, commentary drafted
  total += 4;
  if (report.assignment.effectiveDate) done += 1;
  if (report.comps.filter((c) => c.status === "Settled").length >= GUIDELINES.minClosedComps) done += 1;
  if (report.reconciliation.finalValueOpinion.value != null) done += 1;
  if (report.commentary.length > 0 && report.commentary.every((b) => b.text.trim() !== "")) done += 1;
  return Math.round((done / total) * 100);
}
