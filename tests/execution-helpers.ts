import fs from "node:fs";
import path from "node:path";
import { expect } from "vitest";
import { runAssuranceRecord, runAssuranceStart, runEvidenceRecord } from "../src/kernel/execution.js";
import { isReviewGate } from "../src/kernel/gates.js";
import { runPlan } from "../src/kernel/orchestrator.js";
import { gitCommit, initRepo } from "./helpers.js";

export const frontendIntake = {
  schema: "uads.intake",
  schemaVersion: "0.2.0",
  objective: "Change the primary button color.",
  domainSignals: ["frontend"],
  affectedAreas: ["src"],
  inScope: ["src"],
  acceptanceCriteria: ["Primary button uses the new color", "Selected gates have evidence"],
  classifier: "host-structured",
};

export function seedFrontend(repo: string): void {
  initRepo(repo, "https://github.com/example/uads-exec.git");
  fs.mkdirSync(path.join(repo, "src"), { recursive: true });
  fs.writeFileSync(path.join(repo, "src", "button.css"), "button { color: blue; }\n");
  fs.writeFileSync(path.join(repo, "package.json"), `${JSON.stringify({ name: "exec-fixture", version: "1.0.0" }, null, 2)}\n`);
  gitCommit(repo, "init");
}

export function planFrontend(repo: string, home: string) {
  return runPlan({ cwd: repo, uadsHome: home, intake: frontendIntake });
}

export function implement(repo: string, file = "src/button.css", contents = "button { color: red; }\n"): void {
  fs.writeFileSync(path.join(repo, file), contents);
}

export function recordGates(repo: string, home: string, gates: string[], exitCode = 0): void {
  for (const gate of gates) {
    if (isReviewGate(gate)) {
      continue;
    }
    runEvidenceRecord({
      cwd: repo,
      uadsHome: home,
      gateId: gate,
      kind: "command",
      role: "test-engineer",
      command: `npm run ${gate}`,
      exitCode,
      summary: `${gate} recorded`,
    });
  }
}

export function approveAll(repo: string, home: string, reviewers: string[]): void {
  runAssuranceStart({ cwd: repo, uadsHome: home });
  for (const role of reviewers) {
    runAssuranceRecord({
      cwd: repo,
      uadsHome: home,
      role,
      session: `rev-${role}`,
      implementerSession: "imp-1",
      verdict: "APPROVED",
      summary: `${role} approved`,
    });
  }
}

export function assertZpf(repo: string): void {
  expect(fs.existsSync(path.join(repo, ".uads"))).toBe(false);
  expect(fs.existsSync(path.join(repo, "reviews"))).toBe(false);
  expect(fs.existsSync(path.join(repo, "agents"))).toBe(false);
  expect(fs.existsSync(path.join(repo, "work-orders"))).toBe(false);
  expect(fs.existsSync(path.join(repo, "checkpoints"))).toBe(false);
}
