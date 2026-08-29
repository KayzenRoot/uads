import { EVIDENCE_FILE_NAMES } from "./evidence.js";
import { readZip } from "./zip-read.js";

type ReviewManifest = {
  schema: string;
  repoRoot?: unknown;
  workspace?: unknown;
};

export const REQUIRED_REVIEW_ENTRIES = [
  "review-manifest.json",
  "repository-tree.txt",
  "git-status.txt",
  "git-diff.txt",
  "git-log.txt",
  "version.txt",
  "README.txt",
  ...EVIDENCE_FILE_NAMES.map((name) => `evidence/${name}`),
] as const;

const EXCLUDED_ENTRY_MARKERS = [
  "node_modules/",
  ".git/",
  "memory-bank/",
  "/dist/",
  "coverage/",
];

export type InspectionResult = {
  ok: boolean;
  errors: string[];
};

function isAbsoluteHostPath(value: string): boolean {
  return /[A-Za-z]:\\Users\\/i.test(value) || /\/(?:Users|home)\/[A-Za-z0-9._-]+/.test(value);
}

export async function inspectReviewBundle(
  zipPath: string,
  options: { forbiddenSubstrings?: string[]; requireEvidence?: boolean } = {},
): Promise<InspectionResult> {
  const errors: string[] = [];
  const requireEvidence = options.requireEvidence ?? true;

  let entries;
  try {
    entries = await readZip(zipPath);
  } catch (error) {
    return { ok: false, errors: [`zip-unreadable: ${error instanceof Error ? error.message : String(error)}`] };
  }

  const names = new Set(entries.map((entry) => entry.name.replace(/\\/g, "/")));
  const required = requireEvidence
    ? REQUIRED_REVIEW_ENTRIES
    : REQUIRED_REVIEW_ENTRIES.filter((name) => !name.startsWith("evidence/"));

  for (const requiredName of required) {
    if (!names.has(requiredName)) {
      errors.push(`missing-entry:${requiredName}`);
    }
  }

  for (const name of names) {
    for (const marker of EXCLUDED_ENTRY_MARKERS) {
      if (name.includes(marker)) {
        errors.push(`excluded-path-present:${name}`);
      }
    }
  }

  const manifestEntry = entries.find((entry) => entry.name === "review-manifest.json");
  if (!manifestEntry) {
    errors.push("missing-entry:review-manifest.json");
    return { ok: errors.length === 0, errors };
  }

  let manifest: ReviewManifest;
  try {
    manifest = JSON.parse(manifestEntry.content.toString("utf8")) as ReviewManifest;
  } catch {
    errors.push("manifest-invalid-json");
    return { ok: false, errors };
  }

  if (manifest.schema !== "uads.review-manifest") {
    errors.push("manifest-schema-mismatch");
  }
  if ("repoRoot" in manifest) {
    errors.push("manifest-has-repoRoot");
  }
  if ("workspace" in manifest) {
    errors.push("manifest-has-workspace");
  }
  const serialized = JSON.stringify(manifest);
  if (isAbsoluteHostPath(serialized)) {
    errors.push("manifest-absolute-path");
  }

  const haystack = entries.map((entry) => entry.content.toString("utf8")).join("\n");
  if (isAbsoluteHostPath(haystack)) {
    errors.push("absolute-host-path");
  }
  for (const needle of options.forbiddenSubstrings ?? []) {
    if (needle && haystack.includes(needle)) {
      errors.push("forbidden-leak");
    }
  }

  return { ok: errors.length === 0, errors };
}
