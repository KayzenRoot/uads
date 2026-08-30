import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runCacheExplainCommand, runCacheStatusCommand } from "../commands/cache.js";
import { runCostExplainCommand, runCostStatusCommand } from "../commands/cost.js";
import { evaluateCache } from "../kernel/cache-engine.js";
import { evaluateTokenBudget } from "../kernel/cost-governor.js";
import { readCostLedger, readQptSnapshot } from "../kernel/cost-persist.js";
import { ExecutionBlockedError, runDispatch, runEvidenceRecord, runVerify } from "../kernel/execution.js";
import { currentOrRefreshIndex } from "../kernel/intelligence.js";
import { persistPlan } from "../kernel/persist.js";
import { runPlan } from "../kernel/orchestrator.js";
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
  execFileSync("git", ["remote", "add", "origin", "https://github.com/example/uads-cost-eval.git"], { cwd: root, env: gitEnv });
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
  write(repo, "src/util/format.ts", `export const format = (v: string) => v;\n`);
  write(repo, "docs/README.md", "# fixture\n");
  write(repo, "package.json", `${JSON.stringify({ name: "cost-eval", version: "1.0.0" }, null, 2)}\n`);
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
    outOfScope: ["src/backend"],
    acceptanceCriteria: ["Button uses the new color"],
    classifier: "host-structured",
  };
}

function recordGate(repo: string, home: string, gate: string, extra = ""): void {
  const outputPath = path.join(home, `gate-${gate}.txt`);
  fs.writeFileSync(outputPath, `${gate} captured output${extra}\n`);
  runEvidenceRecord({
    cwd: repo,
    uadsHome: home,
    gateId: gate,
    kind: "command",
    role: "test-engineer",
    command: `npm run ${gate}`,
    exitCode: 0,
    outputPath,
    summary: `${gate} recorded`,
  });
}

function prepared(repo: string, home: string) {
  seedRepo(repo);
  const planned = runPlan({ cwd: repo, uadsHome: home, intake: intake() });
  runDispatch({ cwd: repo, uadsHome: home, session: "imp-1" });
  write(repo, "src/ui/Button.tsx", `import { format } from "../util/format";\nexport const Button = () => format("red");\n`);
  runVerify({ cwd: repo, uadsHome: home });
  recordGate(repo, home, "unit-test");
  return { planned, paths: getUadsPaths(planned.workOrder.projectId, home), root: findPackageRoot() };
}

function bundleOf(repo: string, home: string, projectId: string) {
  const paths = getUadsPaths(projectId, home);
  return currentOrRefreshIndex({ repoRoot: repo, projectId, paths, schemaRoot: findPackageRoot() });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function runCase(item: EvalCase, fn: () => void): { id: string; ok: boolean; error?: string } {
  try {
    fn();
    return { id: item.id, ok: true };
  } catch (error) {
    return { id: item.id, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function main(): number {
  const cases: EvalCase[] = [
    { id: "CC1", name: "exact eligible reuse" },
    { id: "CC2", name: "relevant source invalidation" },
    { id: "CC3", name: "unrelated change remains reusable" },
    { id: "CC4", name: "dependency invalidation" },
    { id: "CC5", name: "manifest invalidation" },
    { id: "CC6", name: "tool version invalidation" },
    { id: "CC7", name: "non-reusable security/review" },
    { id: "CC8", name: "corrupt cache fail closed" },
    { id: "CC9", name: "cross-project rejection" },
    { id: "CC10", name: "hard token budget" },
    { id: "CC11", name: "soft token budget" },
    { id: "CC12", name: "duplicate work avoidance" },
    { id: "CC13", name: "secret-safe cache" },
    { id: "CC14", name: "truthful QPT" },
  ];

  const results = cases.map((item) =>
    runCase(item, () => {
      const repo = fs.mkdtempSync(path.join(os.tmpdir(), "uads-cc-repo-"));
      const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-cc-home-"));
      if (item.id === "CC1") {
        const { planned } = prepared(repo, home);
        const decision = evaluateCache({
          paths: getUadsPaths(planned.workOrder.projectId, home),
          projectId: planned.workOrder.projectId,
          gateId: "unit-test",
          workOrderId: planned.workOrder.workOrderId,
          bundle: bundleOf(repo, home, planned.workOrder.projectId),
          liveChangeDigest: runVerify({ cwd: repo, uadsHome: home }).run.currentChangeDigest,
        });
        assert(decision.decision === "HIT", `CC1 expected HIT, got ${decision.decision}`);
        assert(decision.maySatisfyGate, "CC1 HIT must be allowed to satisfy the gate");
      } else if (item.id === "CC2") {
        const { planned } = prepared(repo, home);
        write(repo, "src/ui/Button.tsx", `import { format } from "../util/format";\nexport const Button = () => format("stale");\n`);
        const decision = evaluateCache({
          paths: getUadsPaths(planned.workOrder.projectId, home),
          projectId: planned.workOrder.projectId,
          gateId: "unit-test",
          bundle: bundleOf(repo, home, planned.workOrder.projectId),
        });
        assert(decision.decision === "STALE", `CC2 expected STALE, got ${decision.decision}`);
        assert(decision.executionRequired, "CC2 must require rerun");
      } else if (item.id === "CC3") {
        const { planned } = prepared(repo, home);
        write(repo, "docs/README.md", "# unrelated docs edit\n");
        const decision = evaluateCache({
          paths: getUadsPaths(planned.workOrder.projectId, home),
          projectId: planned.workOrder.projectId,
          gateId: "unit-test",
          bundle: bundleOf(repo, home, planned.workOrder.projectId),
        });
        assert(decision.decision === "HIT", `CC3 expected HIT after unrelated docs change, got ${decision.decision}`);
        assert(!decision.changedValidityInputs.some((entry) => entry.includes("README")), "CC3 must treat docs as unrelated");
      } else if (item.id === "CC4") {
        const { planned } = prepared(repo, home);
        write(repo, "src/util/format.ts", `export const format = (v: string) => v + "!";\n`);
        const decision = evaluateCache({
          paths: getUadsPaths(planned.workOrder.projectId, home),
          projectId: planned.workOrder.projectId,
          gateId: "unit-test",
          bundle: bundleOf(repo, home, planned.workOrder.projectId),
        });
        assert(decision.decision === "STALE", `CC4 expected STALE, got ${decision.decision}`);
      } else if (item.id === "CC5") {
        const { planned } = prepared(repo, home);
        write(repo, "package.json", `${JSON.stringify({ name: "cost-eval", version: "1.0.1" }, null, 2)}\n`);
        const decision = evaluateCache({
          paths: getUadsPaths(planned.workOrder.projectId, home),
          projectId: planned.workOrder.projectId,
          gateId: "unit-test",
          bundle: bundleOf(repo, home, planned.workOrder.projectId),
        });
        assert(decision.decision === "STALE", `CC5 expected STALE, got ${decision.decision}`);
      } else if (item.id === "CC6") {
        const { planned } = prepared(repo, home);
        const decision = evaluateCache({
          paths: getUadsPaths(planned.workOrder.projectId, home),
          projectId: planned.workOrder.projectId,
          gateId: "unit-test",
          bundle: bundleOf(repo, home, planned.workOrder.projectId),
          liveToolIdentity: { node: "v0.0.0-eval", platform: process.platform, runtimeFamily: "node" },
        });
        assert(decision.decision === "STALE", `CC6 expected STALE, got ${decision.decision}`);
        assert(decision.changedValidityInputs.includes("toolIdentity"), "CC6 must name toolIdentity");
      } else if (item.id === "CC7") {
        const { planned } = prepared(repo, home);
        const decision = evaluateCache({
          paths: getUadsPaths(planned.workOrder.projectId, home),
          projectId: planned.workOrder.projectId,
          gateId: "security-review",
          bundle: bundleOf(repo, home, planned.workOrder.projectId),
        });
        assert(decision.decision === "NOT_REUSABLE", `CC7 expected NOT_REUSABLE, got ${decision.decision}`);
        assert(decision.executionRequired, "CC7 security review remains required");
      } else if (item.id === "CC8") {
        const { planned } = prepared(repo, home);
        const paths = getUadsPaths(planned.workOrder.projectId, home);
        fs.mkdirSync(path.join(paths.workspace, "cache"), { recursive: true });
        fs.writeFileSync(path.join(paths.workspace, "cache", "evidence-index.json"), "{not-json");
        const decision = evaluateCache({
          paths,
          projectId: planned.workOrder.projectId,
          gateId: "unit-test",
          bundle: bundleOf(repo, home, planned.workOrder.projectId),
        });
        assert(decision.decision === "BLOCKED" || decision.decision === "MISS", `CC8 fail-closed, got ${decision.decision}`);
        assert(decision.maySatisfyGate === false, "CC8 must not satisfy the gate");
      } else if (item.id === "CC9") {
        const { planned } = prepared(repo, home);
        const paths = getUadsPaths(planned.workOrder.projectId, home);
        const evidenceDir = path.join(paths.workspace, "cache", "evidence");
        const first = fs.readdirSync(evidenceDir)[0];
        assert(first, "CC9 missing local cache record");
        const foreign = JSON.parse(fs.readFileSync(path.join(evidenceDir, first), "utf8")) as {
          cacheRecordId: string;
          projectId: string;
        };
        foreign.projectId = "ffffffffffff0000";
        foreign.cacheRecordId = "ecr_injectedforeign1";
        fs.writeFileSync(path.join(evidenceDir, "ecr_injectedforeign1.json"), `${JSON.stringify(foreign, null, 2)}\n`);
        const indexPath = path.join(paths.workspace, "cache", "evidence-index.json");
        const index = JSON.parse(fs.readFileSync(indexPath, "utf8")) as {
          projectId: string;
          records: Array<{ cacheRecordId: string; gateId: string; reusable: boolean; status: string }>;
        };
        index.records.push({
          cacheRecordId: "ecr_injectedforeign1",
          gateId: "unit-test",
          reusable: true,
          status: "reusable",
        });
        fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
        const decision = evaluateCache({
          paths,
          projectId: planned.workOrder.projectId,
          gateId: "unit-test",
          bundle: bundleOf(repo, home, planned.workOrder.projectId),
        });
        assert(decision.candidateCacheRecordId !== "ecr_injectedforeign1" || decision.decision !== "HIT", "CC9 reused foreign project cache");
        assert(decision.decision === "BLOCKED" || decision.reasonCodes.includes("CROSS_PROJECT") || decision.decision === "HIT", "CC9 unexpected decision");
        if (decision.decision === "HIT") {
          assert(decision.candidateCacheRecordId !== "ecr_injectedforeign1", "CC9 HIT used the injected foreign record");
        }
      } else if (item.id === "CC10") {
        seedRepo(repo);
        const planned = runPlan({ cwd: repo, uadsHome: home, intake: intake() });
        persistPlan({
          paths: getUadsPaths(planned.workOrder.projectId, home),
          workOrder: {
            ...planned.workOrder,
            tokenBudget: { ...planned.workOrder.tokenBudget, hardLimit: 1 },
          },
          decision: planned.decision,
          checkpoint: planned.checkpoint,
          contextPlan: planned.contextPlan,
        });
        let blocked = false;
        try {
          runDispatch({ cwd: repo, uadsHome: home, session: "imp-1" });
        } catch (error) {
          blocked = error instanceof ExecutionBlockedError || /hard token budget/i.test(String(error));
        }
        assert(blocked, "CC10 dispatch must block on hard budget");
        assert(evaluateTokenBudget(100, 50, 1) === "hard-blocked", "CC10 formula");
      } else if (item.id === "CC11") {
        seedRepo(repo);
        const planned = runPlan({ cwd: repo, uadsHome: home, intake: intake() });
        persistPlan({
          paths: getUadsPaths(planned.workOrder.projectId, home),
          workOrder: {
            ...planned.workOrder,
            tokenBudget: { ...planned.workOrder.tokenBudget, softLimit: 1, hardLimit: 1_000_000 },
          },
          decision: planned.decision,
          checkpoint: planned.checkpoint,
          contextPlan: planned.contextPlan,
        });
        runDispatch({ cwd: repo, uadsHome: home, session: "imp-1" });
        const ledger = readCostLedger(getUadsPaths(planned.workOrder.projectId, home), planned.workOrder.projectId);
        assert(ledger?.budgetStatus === "soft-warning", `CC11 expected soft-warning, got ${ledger?.budgetStatus}`);
        const explain = JSON.parse(runCostExplainCommand({ cwd: repo, uadsHome: home, json: true })) as { outcome: string };
        assert(explain.outcome === "warn", "CC11 explain must warn, not block");
      } else if (item.id === "CC12") {
        const { planned } = prepared(repo, home);
        write(repo, "src/ui/orphan.css", "/* unrelated to the cached unit basis */\n");
        const verified = runVerify({ cwd: repo, uadsHome: home });
        assert(!verified.pendingGates.includes("unit-test"), "CC12 HIT should satisfy eligible unit-test");
        assert(verified.pendingGates.length >= 0, "CC12 pending list remains defined");
        const explain = JSON.parse(
          runCacheExplainCommand({ cwd: repo, uadsHome: home, gateId: "security-review", json: true }),
        ) as { decision: string };
        assert(explain.decision === "NOT_REUSABLE", "CC12 non-reusable gate stays pending/required");
      } else if (item.id === "CC13") {
        seedRepo(repo);
        const planned = runPlan({ cwd: repo, uadsHome: home, intake: intake() });
        runDispatch({ cwd: repo, uadsHome: home, session: "imp-1" });
        write(repo, "src/ui/Button.tsx", `import { format } from "../util/format";\nexport const Button = () => format("red");\n`);
        runVerify({ cwd: repo, uadsHome: home });
        recordGate(repo, home, "unit-test", ` token=${TOKEN} `);
        const cacheDir = path.join(getUadsPaths(planned.workOrder.projectId, home).workspace, "cache");
        const raw = fs.readdirSync(path.join(cacheDir, "evidence")).map((name) =>
          fs.readFileSync(path.join(cacheDir, "evidence", name), "utf8"),
        );
        assert(raw.every((text) => !containsUnredactedSecret(text)), "CC13 cache persisted a secret");
        assert(raw.every((text) => !containsAbsoluteHostPath(text)), "CC13 cache persisted a host path");
      } else if (item.id === "CC14") {
        const { planned } = prepared(repo, home);
        runVerify({ cwd: repo, uadsHome: home });
        const qpt = readQptSnapshot(getUadsPaths(planned.workOrder.projectId, home));
        const status = JSON.parse(runCostStatusCommand({ cwd: repo, uadsHome: home, json: true })) as {
          tokenEstimateMethod: string;
          agentCallsReported: number | null;
          limitations: string[];
        };
        assert(status.tokenEstimateMethod === "byte-heuristic", "CC14 must label byte-heuristic");
        assert(status.agentCallsReported === null, "CC14 invented agent calls");
        assert(status.limitations.some((line) => /not a financial/i.test(line) || /byte-heuristic/i.test(line)), "CC14 missing limitations");
        assert(!JSON.stringify(status).includes("$"), "CC14 invented currency");
        assert(qpt?.qptFormula.includes("estimatedContextTokens"), "CC14 missing documented formula");
        const cacheStatus = runCacheStatusCommand({ cwd: repo, uadsHome: home, json: true });
        assert(cacheStatus.includes("reusableRecords"), "CC14 cache status missing");
      }
    }),
  );

  const failed = results.filter((item) => !item.ok);
  for (const item of results) {
    process.stdout.write(`${item.id} ${item.ok ? "PASS" : "FAIL"}${item.error ? ` ${item.error}` : ""}\n`);
  }
  process.stdout.write(`cost eval ${results.length - failed.length}/${results.length}\n`);
  return failed.length === 0 ? 0 : 1;
}

process.exitCode = main();
