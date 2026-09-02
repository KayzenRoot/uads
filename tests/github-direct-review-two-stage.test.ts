import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";
import { createGithubReviewIndex, validateGithubReviewIndex } from "../src/github/review-index.js";
import { assertSchema } from "../src/lib/json-schema.js";

const root = process.cwd();
const tempRoots: string[] = [];

afterAll(() => {
  for (const directory of tempRoots) fs.rmSync(directory, { recursive: true, force: true });
});

describe("two-stage GitHub direct review contract", () => {
  it("publishes a schema-valid FAIL receipt when a source gate fails", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "uads-ci-receipt-"));
    tempRoots.push(directory);
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    const gates = Object.fromEntries([
      "install", "lint", "typecheck", "build", "action-pins", "tests", "eval-orchestrator", "eval-execution",
      "eval-context", "eval-fault", "eval-cost", "eval-model-routing", "skills-validation", "validate", "npm-audit", "packaging",
    ].map((id) => [id, id === "tests" ? "failure" : id === "eval-orchestrator" ? "skipped" : "success"]));
    const result = spawnSync(process.execPath, ["scripts/github/generate-ci-gate-receipt.mjs", "--output", path.join(directory, "receipt.json"), "--log-dir", directory], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, GITHUB_REPOSITORY: "KayzenRoot/uads", GITHUB_SHA: sha, GITHUB_RUN_ID: "987654", GITHUB_RUN_ATTEMPT: "2", GITHUB_WORKFLOW: "CI", GITHUB_JOB: "foundation", GITHUB_REF_NAME: "main", GITHUB_EVENT_NAME: "push", UADS_CI_JOB_NAME: "Foundation checks", UADS_CI_GATE_STEPS: JSON.stringify(gates) },
    });
    expect(result.status).toBe(0);
    const receipt = JSON.parse(fs.readFileSync(path.join(directory, "receipt.json"), "utf8"));
    expect(() => assertSchema("ci-gate-receipt.schema.json", receipt, root)).not.toThrow();
    expect(receipt.finalVerdict).toBe("FAIL");
    expect(receipt.requiredGates.find((gate: { id: string }) => gate.id === "tests").outcome).toBe("failure");
    const validation = spawnSync(process.execPath, ["scripts/github/validate-ci-gate-receipt.mjs", "--file", path.join(directory, "receipt.json"), "--expected-sha", sha, "--expected-run-id", "987654", "--expected-run-attempt", "2"], { cwd: root, encoding: "utf8" });
    expect(validation.status).toBe(0);
    const forged = { ...receipt, commitSha: "b".repeat(40) };
    fs.writeFileSync(path.join(directory, "forged.json"), JSON.stringify(forged));
    const forgedResult = spawnSync(process.execPath, ["scripts/github/validate-ci-gate-receipt.mjs", "--file", path.join(directory, "forged.json")], { cwd: root, encoding: "utf8" });
    expect(forgedResult.status).not.toBe(0);
  });

  it("keeps the release index canonical and rejects schema extensions", () => {
    const index = createGithubReviewIndex({
      repository: "KayzenRoot/uads",
      version: "0.8.0",
      commitSha: "a".repeat(40),
      gitTreeSha: "b".repeat(40),
      ciRunId: 1,
      ciRunAttempt: 1,
      directReviewRunId: 2,
      directReviewArtifactName: "uads-direct-review-" + "a".repeat(40),
      directReviewEvidenceSha256: "c".repeat(64),
      codeqlRunId: 3,
      codeqlStatus: "success",
      scorecardRunId: null,
      scorecardStatus: "unavailable",
      releaseRunId: 4,
      tag: "v0.8.0",
      expectedTagTargetSha: "a".repeat(40),
      releaseAssetNames: ["github-review-index.json", "github-direct-review-evidence.json"],
    });
    expect(() => validateGithubReviewIndex(index)).not.toThrow();
    expect(() => assertSchema("github-review-index.schema.json", index, root)).not.toThrow();
    expect(() => validateGithubReviewIndex({ ...index, unexpected: true })).toThrow(/additional/i);
  });
});
