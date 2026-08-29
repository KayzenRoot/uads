import { createReviewBundle } from "../lib/review-bundle.js";

export async function runReview(cwd: string = process.cwd()): Promise<string> {
  const result = await createReviewBundle({ cwd });
  const lines = [
    "UADS review bundle generated.",
    `zip: ${result.zipPath}`,
    `sha256: ${result.sha256}`,
    `checksum: ${result.checksumPath}`,
    `projectId: ${result.manifest.projectId}`,
    `filesIncluded: ${result.manifest.includedFiles.length}`,
    `filesSkipped: ${result.manifest.skipped.length}`,
    `evidenceIncluded: ${result.manifest.evidenceIncluded.length}`,
    `inspection: ${result.manifest.inspection.ok ? "PASS" : "FAIL"}`,
  ];
  if (!result.manifest.inspection.ok) {
    lines.push(`inspectionErrors: ${result.manifest.inspection.errors.join(", ")}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}
