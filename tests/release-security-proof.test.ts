import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { assertSchema } from "../src/lib/json-schema.js";
import { createDirectReviewEvidence, validateDirectReviewEvidence } from "../src/github/direct-review.js";
import {
  createSecurityWorkflowProof,
  isCorrectedReleaseVersion,
  selectUniqueDependencyReviewRun,
  securityWorkflowAuthorizationErrors,
  validateSecurityWorkflowProof,
  type SecurityWorkflowProof,
} from "../src/github/security-proof.js";
import { createGithubReviewIndex, validateGithubReviewIndex } from "../src/github/review-index.js";

const repository = "KayzenRoot/uads";
const finalCommitSha = "a".repeat(40);
const finalTreeSha = "b".repeat(40);
const sourceCommitSha = "c".repeat(40);

function proof(workflow: SecurityWorkflowProof["workflow"], outcome: SecurityWorkflowProof["outcome"] = "success", mode: SecurityWorkflowProof["proofMode"] = "exact-sha"): SecurityWorkflowProof {
  const sameTree = mode === "same-tree-pr";
  return createSecurityWorkflowProof({
    workflow,
    proofMode: mode,
    outcome,
    repository,
    finalCommitSha,
    finalTreeSha,
    sourceCommitSha: sameTree ? sourceCommitSha : finalCommitSha,
    sourceTreeSha: finalTreeSha,
    runId: workflow === "codeql" ? 101 : workflow === "scorecard" ? 102 : 103,
    runAttempt: 1,
    pullRequestNumber: sameTree ? 12 : null,
    htmlUrl: `https://github.com/${repository}/actions/runs/${workflow === "codeql" ? 101 : workflow === "scorecard" ? 102 : 103}`,
  });
}

function gates(): Record<string, string> {
  return Object.fromEntries([
    "install", "lint", "typecheck", "build", "action-pins", "tests", "eval-orchestrator", "eval-execution",
    "eval-context", "eval-fault", "eval-cost", "eval-model-routing", "eval-specialist-routing", "eval-adapters",
    "eval-assurance", "eval-fault-injection", "skills-validation", "validate", "npm-audit", "packaging",
  ].map((id) => [id, "success"]));
}

function correctedEvidence(securityWorkflows?: Record<string, unknown>) {
  return createDirectReviewEvidence({
    repository,
    branch: "main",
    commitSha: finalCommitSha,
    gitTreeSha: finalTreeSha,
    version: "0.11.1",
    event: "push",
    workflow: { runId: 120, runAttempt: 1, workflowName: "UADS Direct Review Evidence", jobName: "publish", htmlUrl: `https://github.com/${repository}/actions/runs/120` },
    comparison: { baseSha: "d".repeat(40), headSha: finalCommitSha, changedFileCount: 1, changedPaths: ["src/github/security-proof.ts"] },
    stepOutcomes: gates(),
    securityWorkflows: securityWorkflows as never,
    artifactName: `uads-direct-review-${finalCommitSha}`,
    generatedAt: "2026-09-05T00:00:00.000Z",
  });
}

describe("RG1-RG14 release security proof", () => {
  it("RG1 fails closed for a CodeQL failure", () => {
    const errors = securityWorkflowAuthorizationErrors({ codeql: { proof: proof("codeql", "failure") } }, { repository, finalCommitSha, finalTreeSha });
    expect(errors).toContain("CODEQL_NOT_PROVEN");
  });

  it("RG2 fails closed for an unknown Scorecard result", () => {
    const errors = securityWorkflowAuthorizationErrors({ scorecard: { proof: proof("scorecard", "unknown") } }, { repository, finalCommitSha, finalTreeSha });
    expect(errors).toContain("SCORECARD_NOT_PROVEN");
  });

  it("RG3 accepts an exact-SHA Dependency Review proof", () => {
    expect(validateSecurityWorkflowProof(proof("dependency-review"), { workflow: "dependency-review", repository, finalCommitSha, finalTreeSha })).toEqual([]);
  });

  it("RG4 accepts a same-tree PR Dependency Review proof", () => {
    expect(validateSecurityWorkflowProof(proof("dependency-review", "success", "same-tree-pr"), { workflow: "dependency-review", repository, finalCommitSha, finalTreeSha })).toEqual([]);
  });

  it("RG5 rejects a Dependency Review source SHA mismatch", () => {
    const item = proof("dependency-review", "success", "same-tree-pr");
    const tampered = createSecurityWorkflowProof({ ...item, sourceCommitSha: "e".repeat(40), proofDigest: undefined as never });
    expect(validateSecurityWorkflowProof(tampered, { workflow: "dependency-review", repository, finalCommitSha, finalTreeSha, sourceCommitSha })).toContain("DEPENDENCY_REVIEW_SOURCE_SHA_MISMATCH");
  });

  it("RG6 rejects a same-tree claim whose source tree differs", () => {
    const item = proof("dependency-review", "success", "same-tree-pr");
    expect(validateSecurityWorkflowProof({ ...item, sourceTreeSha: "e".repeat(40) }, { workflow: "dependency-review", repository, finalCommitSha, finalTreeSha })).toContain("DEPENDENCY_REVIEW_TREE_MISMATCH");
  });

  it("RG7 rejects an exact CodeQL proof bound to another final commit", () => {
    const item = proof("codeql");
    expect(validateSecurityWorkflowProof({ ...item, finalCommitSha: "e".repeat(40) }, { workflow: "codeql", repository, finalCommitSha, finalTreeSha })).toContain("SECURITY_PROOF_IDENTITY_MISMATCH");
  });

  it("RG8 detects proof-digest tampering", () => {
    const item = proof("scorecard");
    expect(validateSecurityWorkflowProof({ ...item, proofDigest: "f".repeat(64) }, { workflow: "scorecard", repository, finalCommitSha, finalTreeSha })).toContain("SECURITY_PROOF_DIGEST_MISMATCH");
  });

  it("RG9 rejects ambiguous completed Dependency Review candidates", () => {
    const result = selectUniqueDependencyReviewRun([
      { id: 1, headSha: sourceCommitSha, status: "completed", conclusion: "success", runAttempt: 1 },
      { id: 2, headSha: sourceCommitSha, status: "completed", conclusion: "success", runAttempt: 1 },
    ], sourceCommitSha);
    expect(result).toEqual({ run: null, reasonCode: "DEPENDENCY_REVIEW_RUN_AMBIGUOUS" });
  });

  it("RG10 never returns PASS when all security proof inputs are unknown", () => {
    const item = correctedEvidence();
    expect(item.finalVerdict).toBe("INCOMPLETE");
    expect(item.reasonCodes).toEqual(expect.arrayContaining(["CODEQL_NOT_PROVEN", "SCORECARD_NOT_PROVEN", "DEPENDENCY_REVIEW_NOT_PROVEN"]));
  });

  it("RG11 returns PASS only when all three proofs authorize the same release identity", () => {
    const item = correctedEvidence({
      codeql: { status: "success", outcome: "success", proof: proof("codeql") },
      scorecard: { status: "success", outcome: "success", proof: proof("scorecard") },
      dependencyReview: { status: "success", outcome: "success", proof: proof("dependency-review", "success", "same-tree-pr") },
    });
    expect(item.finalVerdict).toBe("PASS");
    expect(validateDirectReviewEvidence(item)).toEqual([]);
    expect(() => assertSchema("github-direct-review-evidence.schema.json", item, process.cwd())).not.toThrow();
  });

  it("RG12 requires security proofs in the corrected review index", () => {
    expect(() => createGithubReviewIndex({
      repository, version: "0.11.1", commitSha: finalCommitSha, gitTreeSha: finalTreeSha,
      ciRunId: 1, ciRunAttempt: 1, directReviewRunId: 2, directReviewArtifactName: "review.json", directReviewEvidenceSha256: "1".repeat(64),
      codeqlRunId: 3, codeqlStatus: "success", scorecardRunId: 4, scorecardStatus: "success", releaseRunId: null,
      tag: "v0.11.1", expectedTagTargetSha: finalCommitSha, releaseAssetNames: ["review.json"],
    })).toThrow(/security proofs/i);
  });

  it("RG13 rejects review-index proof tampering and accepts the complete typed index", () => {
    const index = createGithubReviewIndex({
      repository, version: "0.11.1", commitSha: finalCommitSha, gitTreeSha: finalTreeSha,
      ciRunId: 1, ciRunAttempt: 1, directReviewRunId: 2, directReviewArtifactName: "review.json", directReviewEvidenceSha256: "1".repeat(64),
      codeqlRunId: 3, codeqlStatus: "success", scorecardRunId: 4, scorecardStatus: "success", releaseRunId: null,
      tag: "v0.11.1", expectedTagTargetSha: finalCommitSha, releaseAssetNames: ["review.json"],
      securityProofs: { codeql: proof("codeql"), scorecard: proof("scorecard"), dependencyReview: proof("dependency-review", "success", "same-tree-pr") },
    });
    expect(() => validateGithubReviewIndex(index)).not.toThrow();
    expect(() => validateGithubReviewIndex({ ...index, securityProofs: { ...index.securityProofs!, codeql: { ...index.securityProofs!.codeql, proofDigest: "0".repeat(64) } } })).toThrow(/security proof/i);
    expect(() => assertSchema("github-review-index.schema.json", index, process.cwd())).not.toThrow();
  });

  it("RG14 keeps v0.11.0 outside corrected-release proof semantics and immutable", () => {
    expect(isCorrectedReleaseVersion("0.11.0")).toBe(false);
    const remoteTag = execFileSync("git", ["ls-remote", "origin", "refs/tags/v0.11.0^{}"], { encoding: "utf8" }).trim().split(/\s+/)[0];
    expect(remoteTag).toBe("d5cb361274cb19f70c8bd02dd023b596b8babf13");
  });
});
