#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { runNpm } from "../lib/exec.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const requiredFiles = [
  "README.md",
  "LICENSE",
  "NOTICE",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "GOVERNANCE.md",
  "ROADMAP.md",
  "CHANGELOG.md",
  "VERSION",
  ".gitignore",
  ".editorconfig",
  ".github/pull_request_template.md",
  ".github/ISSUE_TEMPLATE/bug_report.md",
  ".github/ISSUE_TEMPLATE/feature_request.md",
  ".github/ISSUE_TEMPLATE/security_review.md",
  ".github/CODEOWNERS",
  ".github/dependabot.yml",
  ".github/workflows/ci.yml",
  "docs/01-PROJECT-OVERVIEW.md",
  "docs/02-REQUIREMENTS.md",
  "docs/03-SCOPE.md",
  "docs/04-ARCHITECTURE.md",
  "docs/05-STATE-AND-CHECKPOINT.md",
  "docs/06-CONTEXT-AND-COST-INTELLIGENCE.md",
  "docs/07-QUALITY-GATES.md",
  "docs/08-SECURITY.md",
  "docs/09-PERFORMANCE.md",
  "docs/10-INSTALLATION.md",
  "docs/11-ADAPTERS.md",
  "docs/12-REVIEW-BUNDLE.md",
  "docs/13-DEFINITION-OF-DONE.md",
  "docs/14-BACKLOG.md",
  "skills/uads-orchestrator/SKILL.md",
  "schemas/checkpoint.schema.json",
  "schemas/work-order.schema.json",
  "schemas/evidence-manifest.schema.json",
  "schemas/review-manifest.schema.json",
  "schemas/project-profile.schema.json",
  "schemas/repository-map.schema.json",
  "schemas/intake.schema.json",
  "schemas/routing-decision.schema.json",
  "schemas/execution-run.schema.json",
  "schemas/execution-packet.schema.json",
  "schemas/evidence-record.schema.json",
  "schemas/review-record.schema.json",
  "skills/uads-orchestrator/references/ORCHESTRATION-PROTOCOL.md",
  "evals/orchestrator/e1-frontend-style.json",
  "evals/execution/x1-frontend-happy.json",
  "agents/uads-repo-inspector.md",
  "agents/uads-requirements-engineer.md",
  "agents/uads-software-architect.md",
  "agents/uads-implementation-planner.md",
  "agents/uads-test-engineer.md",
  "src/kernel/orchestrator.ts",
  "src/kernel/execution.ts",
  "src/eval/run.ts",
  "src/eval/execution.ts",
  "scripts/install/install.sh",
  "scripts/install/install.ps1",
  "scripts/install/install.mjs",
  "scripts/lib/exec.mjs",
  "scripts/review/create-review-bundle.mjs",
  "scripts/review/inspect-review-bundle.mjs",
  "scripts/validate/capture-evidence.mjs",
  "schemas/validation-summary.schema.json",
  "src/cli.ts",
  "package.json",
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length > 0) {
  process.stderr.write(`Missing required foundation files:\n${missing.map((file) => `- ${file}`).join("\n")}\n`);
  process.exit(1);
}

function runNpmGate(args) {
  const result = runNpm(args, {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runNpmGate(["run", "lint"]);
runNpmGate(["run", "typecheck"]);
runNpmGate(["run", "build"]);
runNpmGate(["test"]);
runNpmGate(["run", "eval:orchestrator"]);
runNpmGate(["run", "eval:execution"]);
runNpmGate(["run", "validate:skills"]);

const cli = path.join(root, "dist", "cli.js");
for (const args of [["--help"], ["doctor"], ["status"], ["inspect", "--json"]]) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    process.exit(result.status ?? 1);
  }
  if (!result.stdout || result.stdout.trim().length === 0) {
    process.stderr.write(`CLI produced no output for: uads ${args.join(" ")}\n`);
    process.exit(1);
  }
  if (args[0] === "--help") {
    for (const command of ["inspect", "plan", "dispatch", "verify", "finalize", "evidence", "assurance", "status", "resume", "review", "doctor"]) {
      if (!result.stdout.includes(command)) {
        process.stderr.write(`CLI help missing command: ${command}\n`);
        process.exit(1);
      }
    }
  }
}

process.stdout.write("UADS foundation validation passed.\n");
