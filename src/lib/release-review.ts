import crypto from "node:crypto";
import { assertCiBinding } from "../release/ci-binding.js";

export const CANONICAL_GITHUB_FILES = [
  "github/repository.json",
  "github/releases.json",
  "github/tags.json",
  "github/workflows.json",
  "github/main-protection.json",
  "github/security-summary.json",
  "github/labels.json",
  "github/release-vVERSION.json",
  "github/ci-final.json",
  "github/release-run-vVERSION.json",
] as const;

export const CANONICAL_RELEASE_FILES = [
  "release/release-manifest.json",
  "release/validation-report.json",
  "release/SHA256SUMS.txt",
  "release/uads-VERSION.spdx.json",
  "release/ci-binding.json",
  "release/verification-summary.json",
] as const;

type JsonMap = Map<string, string> | Record<string, string>;

function getFile(files: JsonMap, name: string): string | undefined {
  return files instanceof Map ? files.get(name) : files[name];
}

function parse(files: JsonMap, name: string, errors: string[]): any | null {
  const content = getFile(files, name);
  if (content === undefined) {
    errors.push("canonical-missing:" + name);
    return null;
  }
  try {
    return JSON.parse(content);
  } catch {
    errors.push("canonical-invalid-json:" + name);
    return null;
  }
}

function stringAt(value: any, ...keys: string[]): string | null {
  let current = value;
  for (const key of keys) {
    current = current?.[key];
  }
  return typeof current === "string" ? current : null;
}

function sha(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
}

export function validateCanonicalReleaseEvidence(
  files: JsonMap,
  version: string,
  reviewHead?: string | null,
): string[] {
  const errors: string[] = [];
  const githubFiles = CANONICAL_GITHUB_FILES.map((name) =>
    name.replace("VERSION", version),
  );
  const releaseFiles = CANONICAL_RELEASE_FILES.map((name) =>
    name.replace("VERSION", version),
  );
  const releaseManifestNames = (files instanceof Map ? [...files.keys()] : Object.keys(files))
    .filter((name) => name.startsWith("release/release-manifest"));
  if (releaseManifestNames.length !== 1 || releaseManifestNames[0] !== "release/release-manifest.json") {
    errors.push("conflicting-release-manifests");
  }
  for (const name of [...githubFiles, ...releaseFiles]) {
    if (getFile(files, name) === undefined) {
      errors.push("canonical-missing:" + name);
    }
  }

  const repository = parse(files, "github/repository.json", errors);
  const ci = parse(files, "github/ci-final.json", errors);
  const release = parse(files, "github/release-v" + version + ".json", errors);
  const releaseRun = parse(files, "github/release-run-v" + version + ".json", errors);
  const releaseManifest = parse(files, "release/release-manifest.json", errors);
  const validation = parse(files, "release/validation-report.json", errors);
  const binding = parse(files, "release/ci-binding.json", errors);
  const verification = parse(files, "release/verification-summary.json", errors);
  const projectPackageText = getFile(files, "project/package.json");
  const projectVersionText = getFile(files, "project/VERSION");

  let projectPackage: any = null;
  if (projectPackageText === undefined) {
    errors.push("canonical-missing:project/package.json");
  } else {
    try {
      projectPackage = JSON.parse(projectPackageText);
    } catch {
      errors.push("canonical-invalid-json:project/package.json");
    }
  }
  if (projectVersionText === undefined) {
    errors.push("canonical-missing:project/VERSION");
  }

  const expectedTag = "v" + version;
  const mainSha =
    stringAt(repository, "defaultBranchSha") ??
    stringAt(repository, "mainBranchSha") ??
    stringAt(ci, "mainBranchSha");
  const ciHead = stringAt(ci, "headSha") ?? stringAt(ci, "finalCommitSha");
  const tagTarget =
    stringAt(release, "targetCommitSha") ??
    stringAt(release, "targetCommitish") ??
    stringAt(release, "commit");
  const manifestCommit = stringAt(releaseManifest, "commit");
  const validationCommit = stringAt(validation, "commit");
  const bindingHead = stringAt(binding, "headSha");
  const verificationHead = stringAt(verification, "headSha");

  const identities: Array<[string, string | null]> = [
    ["review-head", reviewHead ?? null],
    ["main-branch-sha", mainSha],
    ["ci-head-sha", ciHead],
    ["tag-target-sha", tagTarget],
    ["release-manifest-commit", manifestCommit],
    ["validation-report-commit", validationCommit],
    ["ci-binding-head-sha", bindingHead],
    ["verification-head-sha", verificationHead],
  ];
  for (const [label, value] of identities) {
    if (!sha(value)) {
      errors.push("identity-invalid:" + label);
    }
  }
  const identityValues = identities.map((item) => item[1]).filter((value): value is string => Boolean(value));
  if (identityValues.length > 0 && new Set(identityValues).size !== 1) {
    errors.push("identity-mismatch");
  }

  if (projectPackage?.version !== version) {
    errors.push("version-mismatch:project/package.json");
  }
  if (projectVersionText?.trim() !== version) {
    errors.push("version-mismatch:project/VERSION");
  }
  if (releaseManifest?.version !== version || releaseManifest?.tag !== expectedTag) {
    errors.push("release-manifest-version-mismatch");
  }
  if (validation?.version !== version) {
    errors.push("validation-version-mismatch");
  }
  if (release?.tag_name !== expectedTag || release?.draft !== false || release?.prerelease !== true) {
    errors.push("github-release-metadata-mismatch");
  }
  if (releaseManifest?.ciBinding !== "ci-binding.json" || validation?.ciBinding !== "ci-binding.json") {
    errors.push("ephemeral-ci-binding-reference");
  }
  const artifactNames = new Set(
    Array.isArray(releaseManifest?.artifacts)
      ? releaseManifest.artifacts.map((artifact: any) => artifact?.name)
      : [],
  );
  for (const requiredArtifact of [
    "uads-" + version + ".tgz",
    "uads-" + version + ".spdx.json",
    "validation-report.json",
    "ci-binding.json",
  ]) {
    if (!artifactNames.has(requiredArtifact)) {
      errors.push("release-artifact-missing:" + requiredArtifact);
    }
  }
  try {
    assertCiBinding(binding, bindingHead ?? undefined, repository?.full_name ?? repository?.repository ?? undefined);
  } catch {
    errors.push("ci-binding-invalid");
  }
  if (ci?.status !== "completed" || ci?.conclusion !== "success") {
    errors.push("ci-final-not-success");
  }
  if (releaseRun?.status !== "completed" || releaseRun?.conclusion !== "success") {
    errors.push("release-run-not-success");
  }
  if (verification?.version !== version || verification?.tag !== expectedTag) {
    errors.push("verification-version-mismatch");
  }
  if (typeof getFile(files, "release/SHA256SUMS.txt") === "string") {
    verifyChecksums(files, releaseManifest, errors);
  }
  return [...new Set(errors)];
}

function verifyChecksums(files: JsonMap, manifest: any, errors: string[]): void {
  const checksumText = getFile(files, "release/SHA256SUMS.txt");
  if (checksumText === undefined || !Array.isArray(manifest?.artifacts)) {
    errors.push("checksum-manifest-missing");
    return;
  }
  const entries = new Map<string, string>();
  for (const line of checksumText.split(/\r?\n/)) {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/i);
    if (match?.[1] && match[2]) entries.set(match[2], match[1].toLowerCase());
  }
  for (const artifact of manifest.artifacts) {
    if (entries.get(artifact.name) !== artifact.sha256) {
      errors.push("checksum-mismatch:" + artifact.name);
    }
    const content = getFile(files, "release/" + artifact.name);
    if (content !== undefined && crypto.createHash("sha256").update(content).digest("hex") !== artifact.sha256) {
      errors.push("checksum-content-mismatch:" + artifact.name);
    }
  }
}
