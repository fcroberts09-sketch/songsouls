/**
 * Service seams. Each service is an interface with a typed mock behind it.
 * Swap the mock for a real implementation without touching the UI.
 *
 * // SEAM: dataService       — real MLS / public record / flood / census pulls
 * // SEAM: compService       — real comp search + ranking
 * // SEAM: llmService        — real model/provider wiring + vision endpoint
 * // SEAM: exportService     — real MISMO 3.6 XML + PDF + ZIP assembly
 * // SEAM: submissionService — real UCDP / EAD submission
 */
export { dataService } from "./dataService";
export { compService } from "./compService";
export { llmService } from "./llmService";
export { exportService } from "./exportService";
export { submissionService } from "./submissionService";
