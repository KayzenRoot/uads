#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { computeProjectFingerprint } from "../../dist/lib/fingerprint.js";
import { createReviewBundle } from "../../dist/lib/review-bundle.js";
import { ensureWorkspace } from "../../dist/lib/workspace.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const version = process.argv[2] ?? "0.8.0";
const repo = valueOf("--repo") ?? "KayzenRoot/uads";
const origin = git(["config", "--get", "remote.origin.url"]) ?? repo;
const fingerprint = computeProjectFingerprint({ originUrl: origin, repoRoot: root });
const paths = ensureWorkspace(fingerprint.projectId);
const githubDir = path.join(paths.reviewEvidence, "github");
const releaseDir = path.join(paths.reviewEvidence, "release");
fs.rmSync(paths.reviewEvidence, { recursive: true, force: true });
fs.mkdirSync(githubDir, { recursive: true });
fs.mkdirSync(releaseDir, { recursive: true });

run(process.execPath, [
  path.join(root, "scripts", "github", "audit-repository.mjs"),
  "--repo",
  repo,
  "--release-version",
  version,
  "--output",
  githubDir,
]);
run("gh", ["release", "download", "v" + version, "--repo", repo, "--dir", releaseDir, "--clobber"]);

const manifest = readJson(path.join(releaseDir, "release-manifest.json"));
const validation = readJson(path.join(releaseDir, "validation-report.json"));
const binding = readJson(path.join(releaseDir, "ci-binding.json"));
const release = readJson(path.join(githubDir, "release-v" + version + ".json"));
const ci = readJson(path.join(githubDir, "ci-final.json"));
const releaseRun = readJson(path.join(githubDir, "release-run-v" + version + ".json"));
const tags = readJson(path.join(githubDir, "tags.json"));
const checksums = readChecksums(path.join(releaseDir, "SHA256SUMS.txt"));
const assets = [];
for (const artifact of manifest.artifacts ?? []) {
  const artifactPath = path.join(releaseDir, artifact.name);
  if (!fs.existsSync(artifactPath)) fail("missing release asset: " + artifact.name);
  const actualSha = sha256File(artifactPath);
  if (actualSha !== artifact.sha256 || checksums.get(artifact.name) !== artifact.sha256) {
    fail("release checksum mismatch: " + artifact.name);
  }
  assets.push({ name: artifact.name, size: fs.statSync(artifactPath).size, sha256: actualSha });
}
const manifestSha = sha256File(path.join(releaseDir, "release-manifest.json"));
if (checksums.get("release-manifest.json") !== manifestSha) {
  fail("release manifest checksum is missing or invalid");
}
const v070Tag = tags.find((tag) => tag.name === "v0.7.0");
const v070TargetSha = v070Tag?.targetCommitSha ?? null;
if (v070TargetSha !== "bdfec142ee0b94593a6d0372fb1eb95409ef391d") {
  fail("historical v0.7.0 tag target preservation check failed");
}
writeJson(path.join(releaseDir, "verification-summary.json"), {
  schema: "uads.release-verification-summary",
  schemaVersion: version,
  generatedAt: new Date().toISOString(),
  repository: repo,
  version,
  tag: "v" + version,
  headSha: manifest.commit,
  mainBranchSha: ci.mainBranchSha,
  ciRunId: binding.runId,
  ciConclusion: binding.conclusion,
  releaseRunId: releaseRun.id ?? null,
  releaseRunStatus: releaseRun.status ?? null,
  releaseRunConclusion: releaseRun.conclusion ?? null,
  releaseTagTargetSha: release.targetCommitSha ?? null,
  assets,
  manifestSha256: manifestSha,
  attestation: findAttestationStep(releaseRun),
  historicalTagPreservation: {
    tag: "v0.7.0",
    targetSha: v070TargetSha,
    expectedSha: "bdfec142ee0b94593a6d0372fb1eb95409ef391d",
    unchanged: v070TargetSha === "bdfec142ee0b94593a6d0372fb1eb95409ef391d",
  },
  validation: {
    version: validation.version,
    commit: validation.commit,
    ciBinding: validation.ciBinding,
  },
});

const bundle = await createReviewBundle({
  cwd: root,
  uadsPackageRoot: root,
  requireEvidence: true,
  requireGitHead: true,
  requireCleanTree: true,
  requireCanonicalEvidence: true,
  canonicalReleaseVersion: version,
});
process.stdout.write(JSON.stringify({
  zipPath: bundle.zipPath,
  checksumPath: bundle.checksumPath,
  sha256: bundle.sha256,
  includedReviewEvidence: bundle.manifest.reviewEvidenceIncluded,
}, null, 2) + "\n");

function findAttestationStep(run) {
  for (const job of run.jobs ?? []) {
    for (const step of job.steps ?? []) {
      if (/attest release artifacts/i.test(step.name ?? "")) {
        return { status: step.status, conclusion: step.conclusion, step: step.name };
      }
    }
  }
  return { status: "unavailable", conclusion: "unavailable", step: null };
}
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (error) { fail("invalid JSON: " + file); }
}
function readChecksums(file) {
  const values = new Map();
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/i);
    if (match) values.set(match[2], match[1].toLowerCase());
  }
  return values;
}
function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}
function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : null;
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", stdio: "inherit", windowsHide: true });
  if (result.status !== 0) fail(command + " failed");
}
function valueOf(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
function fail(message) {
  process.stderr.write(message + "\n");
  process.exit(1);
}
