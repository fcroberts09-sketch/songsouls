/**
 * // SEAM: dataService — replace the mock with real MLS / public-record /
 * flood / census integrations. The interface is the contract; the UI only
 * ever sees Sourced<> payloads with Provenance attached.
 */
import type { Provenance, SubjectFieldKey } from "@/lib/types";

export interface AutofillField {
  key: SubjectFieldKey;
  value: string | number;
  provenance: Provenance;
}

export interface DataService {
  /** Pull public-record data for the subject. Returns fields with provenance. */
  fetchPublicRecord(address: string): Promise<AutofillField[]>;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

class MockDataService implements DataService {
  async fetchPublicRecord(address: string): Promise<AutofillField[]> {
    await delay(600); // simulate network
    const now = new Date().toISOString();
    const prov = (confidence: number, detail: string): Provenance => ({
      source: "PublicRecord",
      timestamp: now,
      confidence,
      detail,
    });
    // Deterministic mock payload keyed loosely off the address string.
    const seed = address.length % 3;
    return [
      { key: "county", value: "Maricopa", provenance: prov(0.98, "County assessor roll 2025") },
      { key: "apn", value: `217-44-${100 + seed * 7}`, provenance: prov(0.99, "County assessor roll 2025") },
      { key: "legalDescription", value: "LOT 14 BLK 3 DESERT VISTA UNIT 2", provenance: prov(0.95, "Recorded plat") },
      { key: "lotSizeSqFt", value: 7405 + seed * 320, provenance: prov(0.93, "County GIS") },
      { key: "yearBuilt", value: 1998 + seed, provenance: prov(0.97, "County assessor roll 2025") },
      { key: "zoning", value: "R1-6", provenance: prov(0.9, "Municipal zoning layer") },
      { key: "floodZone", value: "X (unshaded)", provenance: prov(0.96, "FEMA NFHL effective panel") },
    ];
  }
}

export const dataService: DataService = new MockDataService();
