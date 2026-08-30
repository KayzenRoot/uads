import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runDispatch, runContextExpand, ExecutionBlockedError } from "../kernel/execution.js";
import { runPlan, runResume } from "../kernel/orchestrator.js";
import { buildImpactAndPack, refreshIndex } from "../kernel/intelligence.js";
import { lastIndexScan } from "../kernel/index-engine.js";
import { analyzeImpact } from "../kernel/impact.js";
import { readIndexBundle } from "../kernel/intelligence-persist.js";
import { runStatus } from "../commands/status.js";
import { findPackageRoot } from "../lib/version.js";
import { getUadsPaths } from "../lib/workspace.js";
import { containsAbsoluteHostPath } from "../lib/secrets.js";

type EvalCase = { id: string; name: string };

const gitEnv = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "UADS Eval",
  GIT_AUTHOR_EMAIL: "uads@example.com",
  GIT_COMMITTER_NAME: "UADS Eval",
  GIT_COMMITTER_EMAIL: "uads@example.com",
};

function initRepo(root: string): void {
  execFileSync("git", ["init", "-b", "main"], { cwd: root, env: gitEnv });
  execFileSync("git", ["-c", "user.email=uads@example.com", "-c", "user.name=UADS Eval", "config", "commit.gpgsign", "false"], {
    cwd: root,
    env: gitEnv,
  });
  execFileSync("git", ["remote", "add", "origin", "https://github.com/example/uads-context-eval.git"], { cwd: root, env: gitEnv });
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

function seedGraphRepo(repo: string): void {
  initRepo(repo);
  write(repo, "src/ui/Button.tsx", `import "./button.css";\nexport const Button = () => "ok";\n`);
  write(repo, "src/ui/button.css", "button { color: blue; }\n");
  write(repo, "src/ui/Button.test.tsx", `import { Button } from "./Button";\nexport const t = Button;\n`);
  write(repo, "src/util/format.ts", `export const format = (v: string) => v;\n`);
  write(repo, "src/ui/Card.tsx", `import { format } from "../util/format";\nexport const Card = format("card");\n`);
  write(repo, "src/backend/api.ts", `export const handler = () => "api";\n`);
  write(repo, "src/web3/vault.ts", `export const withdraw = () => "no";\n`);
  write(repo, "tests/format.test.ts", `import { format } from "../src/util/format";\nexport const t = format("x");\n`);
  write(repo, "schemas/button.schema.json", `{ "type": "object" }\n`);
  write(repo, "package.json", `${JSON.stringify({ name: "ctx-eval", version: "1.0.0" }, null, 2)}\n`);
  gitCommit(repo, "init");
}

function frontendIntake() {
  return {
    schema: "uads.intake",
    schemaVersion: "0.2.0",
    objective: "Change the primary button color.",
    domainSignals: ["frontend"],
    affectedAreas: ["src/ui"],
    inScope: ["src/ui"],
    outOfScope: ["src/backend", "src/web3"],
    acceptanceCriteria: ["Button uses the new color"],
    classifier: "host-structured",
  };
}

function packPaths(pack: { items: Array<{ path: string }> }): string[] {
  return pack.items.map((item) => item.path);
}

function impactPaths(report: {
  inScopeCandidates: Array<{ path: string }>;
  supportingContext: Array<{ path: string }>;
  possibleImpact: Array<{ path: string }>;
}): string[] {
  return [...report.inScopeCandidates, ...report.supportingContext, ...report.possibleImpact].map((item) => item.path);
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
    .readdirSync(path.join(root, "evals/context"))
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(fs.readFileSync(path.join(root, "evals/context", name), "utf8")) as EvalCase)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const results = cases.map((item) =>
    runCase(item.id, () => {
      const repo = fs.mkdtempSync(path.join(os.tmpdir(), "uads-cci-"));
      const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-cci-home-"));
      seedGraphRepo(repo);
      const planned = runPlan({ cwd: repo, uadsHome: home, intake: frontendIntake() });
      const paths = getUadsPaths(planned.workOrder.projectId, home);
      const indexedCount = refreshIndex({ repoRoot: repo, projectId: planned.workOrder.projectId, paths }).state.files.length;

      if (item.id === "CCI1") {
        const result = buildImpactAndPack({
          repoRoot: repo,
          projectId: planned.workOrder.projectId,
          paths,
          radius: "C2",
          requestedPaths: ["src/ui/Button.tsx"],
          workOrder: planned.workOrder,
        });
        const selected = packPaths(result.pack);
        if (!selected.includes("src/ui/Button.tsx")) throw new Error("missing button seed");
        if (selected.some((rel) => rel.startsWith("src/backend") || rel.startsWith("src/web3"))) {
          throw new Error("C2 pack leaked unrelated backend/web3");
        }
        if (selected.length >= indexedCount) throw new Error("C2 pack is not smaller than the repository");
        return;
      }

      if (item.id === "CCI2") {
        const result = buildImpactAndPack({
          repoRoot: repo,
          projectId: planned.workOrder.projectId,
          paths,
          radius: "C3",
          requestedPaths: ["src/util/format.ts"],
          workOrder: planned.workOrder,
        });
        const selected = impactPaths(result.report);
        if (!selected.includes("src/ui/Card.tsx")) throw new Error("shared utility did not identify dependent Card");
        if (result.pack.contextRadius === "C5") throw new Error("shared utility required C5");
        return;
      }

      if (item.id === "CCI3") {
        refreshIndex({ repoRoot: repo, projectId: planned.workOrder.projectId, paths });
        const reused = refreshIndex({ repoRoot: repo, projectId: planned.workOrder.projectId, paths });
        if (reused.state.mode !== "reused") throw new Error(`expected reused, got ${reused.state.mode}`);
        if (reused.state.filesParsed !== 0) throw new Error("unchanged index reparsed source");
        write(repo, "src/ui/Button.tsx", `import "./button.css";\nexport const Button = () => "changed";\n`);
        const incremental = refreshIndex({ repoRoot: repo, projectId: planned.workOrder.projectId, paths });
        if (incremental.state.mode !== "incrementalUpdate") throw new Error(`expected incrementalUpdate, got ${incremental.state.mode}`);
        if (incremental.state.filesParsed > 3) throw new Error(`single-file change parsed ${incremental.state.filesParsed} files`);
        return;
      }

      if (item.id === "CCI4") {
        fs.unlinkSync(path.join(repo, "src/ui/Card.tsx"));
        gitCommit(repo, "delete card");
        const bundle = refreshIndex({ repoRoot: repo, projectId: planned.workOrder.projectId, paths });
        if (bundle.graph.nodes.some((node) => node.path === "src/ui/Card.tsx")) throw new Error("deleted node remained");
        if (bundle.graph.edges.some((edge) => edge.source === "src/ui/Card.tsx" || edge.target === "src/ui/Card.tsx")) {
          throw new Error("stale edges remained after delete");
        }
        return;
      }

      if (item.id === "CCI5") {
        write(repo, "src/cycle/a.ts", `import { b } from "./b";\nexport const a = b;\n`);
        write(repo, "src/cycle/b.ts", `import { a } from "./a";\nexport const b = a;\n`);
        gitCommit(repo, "cycle");
        const result = buildImpactAndPack({
          repoRoot: repo,
          projectId: planned.workOrder.projectId,
          paths,
          radius: "C3",
          requestedPaths: ["src/cycle/a.ts"],
          workOrder: planned.workOrder,
        });
        if (result.pack.items.length > 20) throw new Error("cycle traversal exploded");
        return;
      }

      if (item.id === "CCI6") {
        const c1 = buildImpactAndPack({
          repoRoot: repo,
          projectId: planned.workOrder.projectId,
          paths,
          radius: "C1",
          requestedPaths: ["src/util/format.ts"],
          workOrder: planned.workOrder,
        });
        if (packPaths(c1.pack).includes("src/ui/Card.tsx")) throw new Error("C1 included a wider-radius dependent");
        const c3 = buildImpactAndPack({
          repoRoot: repo,
          projectId: planned.workOrder.projectId,
          paths,
          radius: "C3",
          requestedPaths: ["src/util/format.ts"],
          workOrder: planned.workOrder,
        });
        if (!impactPaths(c3.report).includes("src/ui/Card.tsx")) throw new Error("C3 missing dependent Card");
        return;
      }

      if (item.id === "CCI7") {
        runDispatch({ cwd: repo, uadsHome: home, session: "imp-1" });
        let blocked = false;
        try {
          analyzeImpact({
            bundle: readIndexBundle(paths, findPackageRoot())!,
            projectId: planned.workOrder.projectId,
            workOrderId: planned.workOrder.workOrderId,
            executionRunId: null,
            radius: "C5",
            requestedPaths: ["src/ui/Button.tsx"],
            affectedAreas: [],
            approveC5: false,
          });
        } catch (error) {
          blocked = /C5/.test(error instanceof Error ? error.message : String(error));
        }
        try {
          runContextExpand({ cwd: repo, uadsHome: home, reason: "need C5 without approval", approveC5: false });
        } catch (error) {
          if (error instanceof ExecutionBlockedError && /C5/.test(error.message)) blocked = true;
        }
        if (!blocked) throw new Error("C5 was not protected");
        return;
      }

      if (item.id === "CCI8") {
        let rejected = false;
        try {
          buildImpactAndPack({
            repoRoot: repo,
            projectId: planned.workOrder.projectId,
            paths,
            radius: "C1",
            requestedPaths: ["../secret.txt"],
            workOrder: planned.workOrder,
          });
        } catch {
          rejected = true;
        }
        if (!rejected) throw new Error("traversal path was accepted");
        write(repo, "src/ui/escape.ts", `import secret from "../../../etc/passwd";\nexport const x = secret;\n`);
        gitCommit(repo, "unsafe import");
        const bundle = refreshIndex({ repoRoot: repo, projectId: planned.workOrder.projectId, paths });
        if (bundle.graph.nodes.some((node) => node.path.includes("etc/passwd") || node.path.includes(".."))) {
          throw new Error("escaped path entered the graph");
        }
        return;
      }

      if (item.id === "CCI9") {
        const result = buildImpactAndPack({
          repoRoot: repo,
          projectId: planned.workOrder.projectId,
          paths,
          radius: "C2",
          requestedPaths: ["src/ui/Button.tsx"],
          workOrder: planned.workOrder,
        });
        const serialized = JSON.stringify(result.pack);
        if (serialized.includes("button { color")) throw new Error("Context Pack persisted source");
        if (containsAbsoluteHostPath(serialized)) throw new Error("Context Pack leaked host paths");
        if (!result.pack.items[0]?.contentDigest) throw new Error("missing content digest");
        return;
      }

      if (item.id === "CCI10") {
        const first = buildImpactAndPack({
          repoRoot: repo,
          projectId: planned.workOrder.projectId,
          paths,
          radius: "C1",
          requestedPaths: ["src/ui/Button.tsx"],
          workOrder: planned.workOrder,
        });
        write(repo, "src/ui/Button.tsx", `import "./button.css";\nexport const Button = () => "stale";\n`);
        const second = buildImpactAndPack({
          repoRoot: repo,
          projectId: planned.workOrder.projectId,
          paths,
          radius: "C1",
          requestedPaths: ["src/ui/Button.tsx"],
          workOrder: planned.workOrder,
        });
        if (first.pack.indexDigest === second.pack.indexDigest) throw new Error("stale pack treated as current");
        const parsed = lastIndexScan.filesParsed;
        runStatus(repo, { uadsHome: home, json: true });
        runResume({ cwd: repo, uadsHome: home });
        if (lastIndexScan.filesParsed !== parsed) throw new Error("status/resume triggered an index scan");
        return;
      }

      throw new Error(`unhandled eval ${item.id}`);
    }),
  );

  for (const result of results) {
    process.stdout.write(`${result.ok ? "PASS" : "FAIL"} ${result.id}${result.error ? ` ${result.error}` : ""}\n`);
  }
  const failed = results.filter((result) => !result.ok).length;
  process.stdout.write(`\n${results.length - failed} passed, ${failed} failed, ${results.length} total\n`);
  return failed === 0 ? 0 : 1;
}

process.exit(main());
