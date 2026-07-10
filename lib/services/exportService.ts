/**
 * // SEAM: exportService — replace with the real MISMO 3.6 XML builder,
 * PDF renderer, and ZIP assembly. The UI treats the package manifest as
 * the contract.
 */
import type { AppraisalReport } from "@/lib/types";

export interface PackageManifest {
  fileName: string;
  xmlFile: string;
  pdfFile: string;
  imageCount: number;
  builtAt: string;
  sizeKb: number;
}

export interface ExportService {
  /** Assemble the UCDP package: MISMO 3.6 XML + PDF + image folder, zipped. */
  buildPackage(report: AppraisalReport): Promise<PackageManifest>;
  /** Export the USPAP workfile (full dataset + audit trail) as JSON. */
  buildWorkfile(report: AppraisalReport): string;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

class MockExportService implements ExportService {
  async buildPackage(report: AppraisalReport): Promise<PackageManifest> {
    await delay(1500); // simulate XML build + PDF render + zip
    const addr = (report.subject.address.value ?? "subject").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return {
      fileName: `${addr}-ucdp.zip`,
      xmlFile: `${addr}-mismo-3.6.xml`,
      pdfFile: `${addr}-urar.pdf`,
      imageCount: report.photos.length,
      builtAt: new Date().toISOString(),
      sizeKb: 4096 + report.photos.length * 850,
    };
  }

  buildWorkfile(report: AppraisalReport): string {
    // USPAP workfile retention: full dataset + append-only audit trail.
    return JSON.stringify(
      { exportedAt: new Date().toISOString(), standard: "USPAP workfile", report },
      null,
      2,
    );
  }
}

export const exportService: ExportService = new MockExportService();
