/**
 * // SEAM: compService — replace the mock with the real comp search/ranking
 * service. Candidates come back ranked; the appraiser decides what enters
 * the grid. The service never adds a comp on its own.
 */
import type { AppraisalReport, Comparable, CompCandidate } from "@/lib/types";

export interface CompService {
  searchComps(report: AppraisalReport): Promise<CompCandidate[]>;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function monthsAgoIso(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

class MockCompService implements CompService {
  async searchComps(report: AppraisalReport): Promise<CompCandidate[]> {
    await delay(800);
    const subjGla = report.subject.gla.value ?? 1850;
    const base = report.assignment.contractPrice ?? 450000;
    const now = new Date().toISOString();
    const mk = (
      n: number,
      over: Partial<Comparable>,
      score: number,
      rationale: string,
    ): CompCandidate => ({
      score,
      rationale,
      comp: {
        id: `cand_${report.orderId}_${n}`,
        address: over.address ?? `${4000 + n * 37} E Cactus Wren Dr`,
        city: "Phoenix",
        status: "Settled",
        salePrice: Math.round((base * (0.94 + n * 0.025)) / 1000) * 1000,
        saleDate: monthsAgoIso(2 + n),
        distanceMiles: 0.3 + n * 0.18,
        locationRating: "Neutral",
        siteSqFt: 7200 + n * 250,
        view: "Neutral",
        design: "Ranch",
        quality: "Q4",
        condition: n % 2 === 0 ? "C3" : "C4",
        yearBuilt: 1996 + n,
        roomCount: 7,
        bedrooms: n % 2 === 0 ? 4 : 3,
        bathsFull: 2,
        bathsHalf: n % 3 === 0 ? 1 : 0,
        gla: Math.round(subjGla * (0.92 + n * 0.045)),
        basementSqFt: 0,
        basementFinishedSqFt: 0,
        garageSpaces: n % 2 === 0 ? 2 : 3,
        saleType: "Arm's length",
        concessions: n === 2 ? 5000 : 0,
        provenance: { source: "MLS", timestamp: now, confidence: 0.97, detail: "ARMLS #68" + (40000 + n * 113) },
        adjustments: [],
        ...over,
      },
    });
    return [
      mk(0, {}, 94, "Same subdivision, settled 8 weeks ago, GLA within 8%"),
      mk(1, {}, 88, "0.5 mi, similar quality/condition, slightly smaller GLA"),
      mk(2, {}, 81, "Closest sale price; carries $5,000 seller concessions"),
      mk(3, { status: "Pending" }, 74, "Pending sale — usable as supplemental support only"),
      mk(4, { distanceMiles: 1.4 }, 66, "Strong physical match but beyond the 1.0 mi guideline"),
      mk(5, { saleDate: monthsAgoIso(14) }, 58, "Model match but sale is 14 months old"),
    ].sort((a, b) => b.score - a.score);
  }
}

export const compService: CompService = new MockCompService();
