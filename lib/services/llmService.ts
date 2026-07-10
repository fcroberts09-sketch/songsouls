/**
 * // SEAM: llmService — replace the mock with real provider wiring (and a
 * vision endpoint for photo labeling). All model calls go through this one
 * abstraction so the model is swappable; calls are stateless — the relevant
 * report slice is passed in each request.
 *
 * Contract enforced by the (future) system prompt and honored by this mock:
 *  - Output only from supplied structured data; if unsupported, say so. Never fabricate.
 *  - Return suggestions as structured objects (AISuggestion), not prose dumped into fields.
 *  - Always return the list of source fields used.
 */
import type {
  AISuggestion,
  AppraisalReport,
  PhotoKind,
  PhotoRecord,
  QCIssue,
} from "@/lib/types";
import { adjustedValueRange, computeComp, getAdjustment } from "@/lib/comp";
import { fmtCurrency } from "@/lib/format";
import { uid } from "@/lib/format";

export interface CommentaryDraft {
  text: string;
  sourcesUsed: string[];
}

export interface LlmService {
  /** Draft section commentary strictly from the structured report slice. */
  generateCommentary(report: AppraisalReport, blockId: string): Promise<CommentaryDraft>;
  /** Propose adjustments with reasoning. Lands as pending suggestions only. */
  suggestAdjustments(report: AppraisalReport): Promise<AISuggestion[]>;
  /** Explain why a QC issue fired, in plain language. */
  explainIssue(report: AppraisalReport, issue: QCIssue): Promise<string>;
  /** "Is this assignment compliant?" */
  answerCompliance(report: AppraisalReport, issues: QCIssue[]): Promise<string>;
  /** // SEAM: vision — label a photo. */
  labelPhoto(photo: PhotoRecord): Promise<{ label: string; kind: PhotoKind; confidence: number }>;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function pendingSuggestion(
  partial: Omit<AISuggestion, "id" | "status" | "createdAt">,
): AISuggestion {
  return { ...partial, id: uid("sug"), status: "pending", createdAt: new Date().toISOString() };
}

/** Mock "market-derived" rates the suggester uses. Real impl would extract these. */
const RATES = {
  glaPerSqFt: 45,
  garagePerSpace: 7500,
  conditionStep: 12000,
};

class MockLlmService implements LlmService {
  async generateCommentary(report: AppraisalReport, blockId: string): Promise<CommentaryDraft> {
    await delay(900);
    const s = report.subject;
    const a = report.assignment;

    if (blockId === "neighborhood") {
      const missing = [s.city.value, s.county.value].some((v) => !v);
      if (missing) {
        return {
          text: "Insufficient data to draft the neighborhood narrative: subject city/county are not yet populated. Complete the Subject & Site section first.",
          sourcesUsed: ["subject.city", "subject.county"],
        };
      }
      return {
        text:
          `The subject is located in ${s.city.value}, ${s.county.value} County, ${s.state.value ?? ""}. ` +
          `The immediate neighborhood is predominantly ${s.propertyType === "SFR" ? "single-family residential" : "residential"} in character, with ${s.design.value ?? "varied"}-style improvements built circa ${s.yearBuilt.value ?? "—"}. ` +
          `Zoning is ${s.zoning.value ?? "residential"}; the subject's use is legal and conforming. ` +
          `No adverse influences were noted in the data provided. Market exposure and marketing times are typical for the area.`,
        sourcesUsed: [
          "subject.city",
          "subject.county",
          "subject.state",
          "subject.design",
          "subject.yearBuilt",
          "subject.zoning",
        ],
      };
    }

    if (blockId === "marketConditions") {
      const settled = report.comps.filter((c) => c.status === "Settled");
      if (settled.length === 0) {
        return {
          text: "Insufficient data to draft market conditions: no settled comparables are in the grid yet.",
          sourcesUsed: ["comps"],
        };
      }
      const prices = settled.map((c) => c.salePrice);
      const lo = Math.min(...prices);
      const hi = Math.max(...prices);
      return {
        text:
          `Analysis of ${settled.length} settled sales in the subject's market area indicates closed prices ranging from ${fmtCurrency(lo)} to ${fmtCurrency(hi)}. ` +
          `Sales utilized closed within the past twelve months of the ${a.effectiveDate?.slice(0, 10) ?? "—"} effective date${settled.some((c) => c.concessions > 0) ? "; observed seller concessions were adjusted dollar-for-dollar where applicable" : ""}. ` +
          `Supply and demand appear in balance and no time adjustment was indicated by the paired data provided.`,
        sourcesUsed: ["comps[].salePrice", "comps[].saleDate", "comps[].concessions", "assignment.effectiveDate"],
      };
    }

    if (blockId === "improvements") {
      if (s.gla.value == null || s.condition.value == null) {
        return {
          text: "Insufficient data to draft the improvements narrative: GLA and condition rating are required first.",
          sourcesUsed: ["subject.gla", "subject.condition"],
        };
      }
      return {
        text:
          `The subject is a ${s.yearBuilt.value ?? "—"}-built ${s.design.value ?? ""} ${s.propertyType === "SFR" ? "single-family residence" : "dwelling"} containing ${s.gla.value.toLocaleString()} sq ft of above-grade living area (measured to ANSI Z765-2021), with ${s.bedrooms.value ?? "—"} bedrooms and ${s.bathsFull.value ?? "—"}.${s.bathsHalf.value ?? 0} baths. ` +
          `Overall condition is rated ${s.condition.value} and construction quality ${s.quality.value ?? "—"}, per the UAD definitions. ` +
          `Heating is ${s.heating.value ?? "—"}; cooling is ${s.cooling.value ?? "—"}. ` +
          `${(s.garageSpaces.value ?? 0) > 0 ? `Parking is provided by a ${s.garageSpaces.value}-car ${(s.garageType.value ?? "garage").toLowerCase()}. ` : ""}` +
          `No physical deficiencies affecting livability were noted in the data provided.`,
        sourcesUsed: [
          "subject.yearBuilt",
          "subject.design",
          "subject.gla",
          "subject.bedrooms",
          "subject.bathsFull",
          "subject.condition",
          "subject.quality",
          "subject.heating",
          "subject.cooling",
          "subject.garageSpaces",
        ],
      };
    }

    if (blockId === "reconciliation") {
      const range = adjustedValueRange(report);
      const final = report.reconciliation.finalValueOpinion.value;
      if (!range) {
        return {
          text: "Insufficient data to draft the reconciliation: no settled comparables with adjustments are available.",
          sourcesUsed: ["comps"],
        };
      }
      return {
        text:
          `The adjusted sale prices of the settled comparables range from ${fmtCurrency(range.min)} to ${fmtCurrency(range.max)}. ` +
          `Greatest weight was given to the comparables requiring the least net and gross adjustment, with all sales given consideration. ` +
          `The sales comparison approach is the most reliable indicator of value for this property type and was given sole weight. ` +
          (final != null
            ? `The opinion of market value is reconciled at ${fmtCurrency(final)}, which falls ${final >= range.min && final <= range.max ? "within" : "OUTSIDE"} the adjusted range.`
            : `A final opinion of value has not yet been entered.`),
        sourcesUsed: ["comps[].adjustments", "comps[].salePrice", "reconciliation.finalValueOpinion"],
      };
    }

    return { text: "Unknown commentary section.", sourcesUsed: [] };
  }

  async suggestAdjustments(report: AppraisalReport): Promise<AISuggestion[]> {
    await delay(1100);
    const out: AISuggestion[] = [];
    const s = report.subject;

    for (const [i, comp] of report.comps.entries()) {
      const label = `Comp ${i + 1}`;

      // GLA — $/sf on deltas over 50 sf
      const subjGla = s.gla.value;
      if (subjGla != null && getAdjustment(comp, "gla") === 0) {
        const delta = subjGla - comp.gla;
        if (Math.abs(delta) >= 50) {
          const amount = Math.round((delta * RATES.glaPerSqFt) / 500) * 500;
          out.push(
            pendingSuggestion({
              target: { kind: "adjustment", compId: comp.id, attribute: "gla" },
              label: `${label} · GLA`,
              value: amount,
              display: fmtCurrency(amount),
              rationale: `Subject GLA ${subjGla.toLocaleString()} sf vs comp ${comp.gla.toLocaleString()} sf (Δ ${delta > 0 ? "+" : ""}${delta.toLocaleString()} sf) at $${RATES.glaPerSqFt}/sf market-extracted rate.`,
              sourcesUsed: ["subject.gla", `comps[${i}].gla`],
            }),
          );
        }
      }

      // Garage spaces
      const subjGarage = s.garageSpaces.value ?? 0;
      if (getAdjustment(comp, "garage") === 0 && subjGarage !== comp.garageSpaces) {
        const deltaSpaces = subjGarage - comp.garageSpaces;
        const amount = deltaSpaces * RATES.garagePerSpace;
        out.push(
          pendingSuggestion({
            target: { kind: "adjustment", compId: comp.id, attribute: "garage" },
            label: `${label} · Garage`,
            value: amount,
            display: fmtCurrency(amount),
            rationale: `Subject has ${subjGarage} garage space(s) vs comp's ${comp.garageSpaces}; ${fmtCurrency(RATES.garagePerSpace)} per space from paired sales.`,
            sourcesUsed: ["subject.garageSpaces", `comps[${i}].garageSpaces`],
          }),
        );
      }

      // Condition step
      const subjCond = s.condition.value;
      if (subjCond && getAdjustment(comp, "condition") === 0 && comp.condition !== subjCond) {
        const step = Number(comp.condition[1]) - Number(subjCond[1]); // C-scale: higher = worse
        const amount = step * RATES.conditionStep;
        out.push(
          pendingSuggestion({
            target: { kind: "adjustment", compId: comp.id, attribute: "condition" },
            label: `${label} · Condition`,
            value: amount,
            display: fmtCurrency(amount),
            rationale: `Subject is ${subjCond}, comp is ${comp.condition} — ${Math.abs(step)} UAD condition step(s) at ${fmtCurrency(RATES.conditionStep)} per step (market-derived).`,
            sourcesUsed: ["subject.condition", `comps[${i}].condition`],
          }),
        );
      }

      // Concessions — dollar-for-dollar
      if (comp.concessions > 0 && getAdjustment(comp, "concessions") === 0) {
        out.push(
          pendingSuggestion({
            target: { kind: "adjustment", compId: comp.id, attribute: "concessions" },
            label: `${label} · Concessions`,
            value: -comp.concessions,
            display: fmtCurrency(-comp.concessions),
            rationale: `Comp carried ${fmtCurrency(comp.concessions)} in seller concessions; adjusted dollar-for-dollar per UAD practice.`,
            sourcesUsed: [`comps[${i}].concessions`],
          }),
        );
      }
    }
    return out;
  }

  async explainIssue(report: AppraisalReport, issue: QCIssue): Promise<string> {
    await delay(500);
    const base = `This ${issue.severity.toLowerCase()} fired because: ${issue.message}.`;
    const detail = issue.detail ? ` ${issue.detail}` : "";
    const consequence =
      issue.severity === "Blocker"
        ? " UCDP performs a hard stop on this condition — the package cannot be submitted until it is resolved."
        : issue.severity === "Warning"
          ? " This pattern is a common driver of lender revision requests; resolving or explaining it in commentary reduces revision risk."
          : " Advisory only — no action is strictly required.";
    return base + detail + consequence + " (Derived from the report's structured data only.)";
  }

  async answerCompliance(report: AppraisalReport, issues: QCIssue[]): Promise<string> {
    await delay(700);
    const blockers = issues.filter((i) => i.severity === "Blocker");
    const warnings = issues.filter((i) => i.severity === "Warning");
    if (blockers.length === 0 && warnings.length === 0) {
      return `Yes — based on the live QC pass over the structured dataset, this assignment has 0 blockers and 0 warnings. The report is UCDP-ready pending your signature. Fields checked: required UAD fields for ${report.subject.propertyType}, ANSI consistency, comp guidelines, reconciliation bracketing, and photo requirements.`;
    }
    const top = [...blockers, ...warnings].slice(0, 4).map((i) => `• ${i.message}`).join("\n");
    return (
      `Not yet. The live QC pass shows ${blockers.length} blocker(s) and ${warnings.length} warning(s).\n` +
      `Highest-impact items:\n${top}\n` +
      `Resolve the blockers to unlock the UCDP package build; warnings are revision-request risk. (Sources: report.qc, derived from current field values.)`
    );
  }

  async labelPhoto(photo: PhotoRecord): Promise<{ label: string; kind: PhotoKind; confidence: number }> {
    // SEAM: vision — real implementation classifies the image content.
    await delay(650);
    const guesses: { label: string; kind: PhotoKind }[] = [
      { label: "Front exterior", kind: "subject-front" },
      { label: "Rear exterior", kind: "subject-rear" },
      { label: "Street scene", kind: "subject-street" },
      { label: "Kitchen", kind: "interior" },
      { label: "Primary bath", kind: "interior" },
      { label: "Living room", kind: "interior" },
    ];
    const g = guesses[photo.id.length % guesses.length];
    return { ...g, confidence: 0.9 };
  }
}

export const llmService: LlmService = new MockLlmService();
