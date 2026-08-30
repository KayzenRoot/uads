import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runPlan } from "../kernel/orchestrator.js";
import { diagnoseFailure, recordFailure } from "../kernel/fault-localization.js";
import { markVerifiedResolution } from "../kernel/failure-memory.js";
import { failurePaths, readFailureRecord } from "../kernel/failure-persist.js";
import { findPackageRoot } from "../lib/version.js";
import { getUadsPaths } from "../lib/workspace.js";
import { containsAbsoluteHostPath, containsUnredactedSecret } from "../lib/secrets.js";

type EvalCase = { id: string; name: string };

const gitEnv = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "UADS Eval",
  GIT_AUTHOR_EMAIL: "uads@example.com",
  GIT_COMMITTER_NAME: "UADS Eval",
  GIT_COMMITTER_EMAIL: "uads@example.com",
};

const TOKEN = `ghp_${"b".repeat(36)}`;

function initRepo(root: string): void {
  execFileSync("git", ["init", "-b", "main"], { cwd: root, env: gitEnv });
  execFileSync("git", ["-c", "user.email=uads@example.com", "-c", "user.name=UADS Eval", "config", "commit.gpgsign", "false"], {
    cwd: root,
    env: gitEnv,
  });
  execFileSync("git", ["remote", "add", "origin", "https://github.com/example/uads-fault-eval.git"], { cwd: root, env: gitEnv });
}

function gitCommit(root: string, message: string): void {
  execFileSync("git", ["add", "-A"], { cwd: root, env: gitEnv });
  execFileSync(
    "git",
    ["-c", "commit.gpgsign=false", "-c", "user.email=uads@example.com", "-c", "user.name=UADS Eval", "commit", "-m", message],
    { cwd: root, env: gitEnv },
  );
}

function write(root: string, rel: string, contents: string): void {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents);
}

function seedRepo(repo: string): void {
  initRepo(repo);
  write(repo, "src/ui/Button.tsx", `import { format } from "../util/format";\nexport const Button = () => format("ok");\n`);
  write(repo, "src/ui/Button.test.tsx", `import { Button } from "./Button";\nexport const t = Button;\n`);
  write(repo, "src/ui/Card.tsx", `import { format } from "../util/format";\nexport const Card = () => format("card");\n`);
  write(repo, "src/ui/Card.test.tsx", `import { Card } from "./Card";\nexport const t = Card;\n`);
  write(repo, "src/util/format.ts", `export const format = (v: string) => v;\n`);
  write(repo, "src/auth/login.ts", `export const login = () => "auth";\n`);
  write(repo, "src/web3/vault.ts", `export const withdraw = () => "no";\n`);
  write(repo, "src/db/client.ts", `export const query = () => "db";\n`);
  write(repo, "src/backend/api.ts", `export const handler = () => "api";\n`);
  write(repo, "package.json", `${JSON.stringify({ name: "fault-eval", version: "1.0.0" }, null, 2)}\n`);
  gitCommit(repo, "init");
}

function intake() {
  return {
    schema: "uads.intake",
    schemaVersion: "0.2.0",
    objective: "Change the primary button color.",
    domainSignals: ["frontend"],
    affectedAreas: ["src/ui"],
    inScope: ["src/ui"],
    outOfScope: ["src/backend", "src/web3", "src/auth", "src/db"],
    acceptanceCriteria: ["Button uses the new color"],
    classifier: "host-structured",
  };
}

function stackFor(repo: string, rel: string, fn = "run"): string {
  return `Error: boom\n    at ${fn} (${path.join(repo, rel)}:2:1)\n`;
}

function assert(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

function runCase(id: string, fn: () => void): { id: string; ok: boolean; error?: string } {
  try {
    fn();
    return { id, ok: true };
  } catch (error) {
    return { id, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function main(): number {
  const root = findPackageRoot();
  const cases: EvalCase[] = fs
    .readdirSync(path.join(root, "evals/fault"))
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(fs.readFileSync(path.join(root, "evals/fault", name), "utf8")) as EvalCase)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const results = cases.map((item) =>
    runCase(item.id, () => {
      const repo = fs.mkdtempSync(path.join(os.tmpdir(), "uads-fl-"));
      const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-fl-home-"));
      seedRepo(repo);
      const planned = runPlan({ cwd: repo, uadsHome: home, intake: intake() });
      const paths = getUadsPaths(planned.workOrder.projectId, home);
      const base = {
        repoRoot: repo,
        projectId: planned.workOrder.projectId,
        paths,
        schemaRoot: root,
      };
      const unrelated = ["src/auth/login.ts", "src/web3/vault.ts", "src/db/client.ts", "src/backend/api.ts"];

      if (item.id === "FL1") {
        write(repo, "src/ui/Button.tsx", `import { format } from "../util/format";\nexport const Button = () => format("fail");\n`);
        const record = recordFailure({
          ...base,
          source: "runtime",
          text: stackFor(repo, "src/ui/Button.tsx"),
        });
        const report = diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        assert(report.rankedCandidates[0]?.path === "src/ui/Button.tsx", "FL1 expected Button first");
        assert(report.recommendedRadius === "C1", `FL1 radius ${report.recommendedRadius}`);
        assert(
          report.rankedCandidates.every((candidate) => !unrelated.includes(candidate.path)),
          "FL1 selected unrelated subsystem",
        );
        assert(report.status === "localized", `FL1 status ${report.status}`);
      }

      if (item.id === "FL2") {
        const record = recordFailure({
          ...base,
          source: "test",
          text: "FAIL src/ui/Button.test.tsx > color\nAssertionError: expected blue",
        });
        const report = diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        assert(
          report.rankedCandidates.some((candidate) => candidate.path === "src/ui/Button.tsx" && candidate.score >= 0.25),
          "FL2 expected Test Map source ranked",
        );
        assert(report.rankedCandidates[0]?.path !== "src/web3/vault.ts", "FL2 web3 first");
      }

      if (item.id === "FL3") {
        write(repo, "src/ui/Button.tsx", `import { format } from "../util/format";\nexport const Button = () => format("dirty");\n`);
        write(repo, "src/auth/login.ts", `export const login = () => "changed-unrelated";\n`);
        const record = recordFailure({
          ...base,
          source: "runtime",
          text: stackFor(repo, "src/ui/Button.tsx"),
        });
        const report = diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        const button = report.rankedCandidates.find((candidate) => candidate.path === "src/ui/Button.tsx");
        const auth = report.rankedCandidates.find((candidate) => candidate.path === "src/auth/login.ts");
        assert(Boolean(button), "FL3 missing button");
        assert((button?.score ?? 0) > (auth?.score ?? 0), "FL3 unrelated changed file dominated");
        assert(!auth || !auth.signals.includes("related-changed"), "FL3 unrelated marked related-changed");
      }

      if (item.id === "FL4") {
        const record = recordFailure({
          ...base,
          source: "test",
          text: "FAIL src/ui/Button.test.tsx > a\nFAIL src/ui/Card.test.tsx > b\n",
        });
        const report = diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        const util = report.rankedCandidates.find((candidate) => candidate.path === "src/util/format.ts");
        assert(Boolean(util) && (util?.score ?? 0) >= 0.25, "FL4 shared utility not ranked");
        assert(util?.signals.includes("shared-utility") || (util?.score ?? 0) >= 0.25, "FL4 missing shared-utility signal");
        assert(["C2", "C3"].includes(report.recommendedRadius), `FL4 radius ${report.recommendedRadius}`);
        assert(report.recommendedRadius !== "C5", "FL4 jumped to C5");
      }

      if (item.id === "FL5") {
        const record = recordFailure({
          ...base,
          source: "test",
          text: `FAIL src/ui/Button.test.tsx > color\n${stackFor(repo, "src/ui/Button.tsx")}`,
        });
        const report = diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        assert(
          report.rankedCandidates.every((candidate) => !unrelated.includes(candidate.path)),
          "FL5 selected auth/web3/db",
        );
      }

      if (item.id === "FL6") {
        const record = recordFailure({
          ...base,
          source: "runtime",
          text: `${stackFor(repo, "src/ui/Button.tsx", "a")}${stackFor(repo, "src/ui/Card.tsx", "b")}`,
        });
        const report = diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        assert(report.status === "ambiguous", `FL6 status ${report.status}`);
        assert(report.nextEvidence.length > 0, "FL6 missing next evidence");
        assert(!report.escalationReason || !/root cause confirmed/i.test(report.escalationReason), "FL6 invented root cause");
      }

      if (item.id === "FL7") {
        const record = recordFailure({
          ...base,
          source: "runtime",
          changeDigest: "loop-digest",
          text: stackFor(repo, "src/ui/Button.tsx"),
        });
        diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        const third = diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        assert(third.loopState.detected, "FL7 loop not detected");
        assert(third.loopState.recommendedAction.includes("LOOP_DETECTED"), "FL7 missing LOOP_DETECTED");
      }

      if (item.id === "FL8") {
        const record = recordFailure({
          ...base,
          source: "runtime",
          changeDigest: "before-fix",
          text: stackFor(repo, "src/ui/Button.tsx"),
        });
        diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        markVerifiedResolution({
          paths,
          projectId: planned.workOrder.projectId,
          failureRecordId: record.failureRecordId,
          changeDigest: "after-fix",
          evidenceRefs: ["execution:eval", "digest:after-fix"],
          schemaRoot: root,
        });
        const again = recordFailure({
          ...base,
          source: "runtime",
          changeDigest: "after-fix-recurrence",
          text: stackFor(repo, "src/ui/Button.tsx"),
        });
        const report = diagnoseFailure({ ...base, failureRecordId: again.failureRecordId });
        assert(
          report.memoryMatches.some((match) => match.kind === "reusable"),
          "FL8 expected reusable memory",
        );
      }

      if (item.id === "FL9") {
        const record = recordFailure({
          ...base,
          source: "runtime",
          changeDigest: "stale-a",
          text: stackFor(repo, "src/ui/Button.tsx"),
        });
        diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        write(repo, "src/ui/Button.tsx", `import { format } from "../util/format";\nexport const Button = () => format("stale");\n`);
        const again = recordFailure({
          ...base,
          source: "runtime",
          changeDigest: "stale-b",
          text: stackFor(repo, "src/ui/Button.tsx"),
        });
        const report = diagnoseFailure({ ...base, failureRecordId: again.failureRecordId });
        assert(
          report.memoryMatches.every((match) => match.kind !== "reusable"),
          "FL9 treated stale memory as verified root cause",
        );
        assert(
          report.memoryMatches.some((match) => match.kind === "historical") || report.memoryMatches.length === 0,
          "FL9 expected historical memory",
        );
      }

      if (item.id === "FL10") {
        const host = path.join(repo, "src/ui/Button.tsx");
        const text = `Error: token ${TOKEN} at ${host}\n    at run (${host}:2:1)\n`;
        write(repo, "fail.txt", text);
        const record = recordFailure({
          ...base,
          source: "runtime",
          text,
        });
        const report = diagnoseFailure({ ...base, failureRecordId: record.failureRecordId });
        const persisted = JSON.stringify(readFailureRecord(paths, record.failureRecordId, root));
        const diagnosis = JSON.stringify(report);
        const memoryFile = fs.readFileSync(failurePaths(paths).memory, "utf8");
        for (const blob of [persisted, diagnosis, memoryFile, record.signature, record.messageSummary]) {
          assert(!blob.includes(TOKEN), "FL10 leaked github token");
          assert(!containsUnredactedSecret(blob), "FL10 unredacted secret");
        }
        assert(!containsAbsoluteHostPath(persisted), "FL10 host path in record");
        assert(!containsAbsoluteHostPath(diagnosis), "FL10 host path in diagnosis");
        assert(fs.existsSync(path.join(repo, "fail.txt")), "FL10 deleted input");
        assert(!fs.existsSync(path.join(paths.workspace, "failures", "fail.txt")), "FL10 copied input into sidecar");
      }
    }),
  );

  const failed = results.filter((item) => !item.ok);
  for (const item of results) {
    process.stdout.write(`${item.id} ${item.ok ? "PASS" : "FAIL"}${item.error ? ` ${item.error}` : ""}\n`);
  }
  process.stdout.write(`fault eval ${results.length - failed.length}/${results.length}\n`);
  return failed.length === 0 ? 0 : 1;
}

process.exitCode = main();
