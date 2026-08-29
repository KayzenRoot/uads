#!/usr/bin/env node
import { Command } from "commander";
import { runAssuranceRecordCommand, runAssuranceStartCommand } from "./commands/assurance.js";
import { runContextExpandCommand } from "./commands/context.js";
import { runDispatchCommand } from "./commands/dispatch.js";
import { runDoctor } from "./commands/doctor.js";
import { runEvidenceRecordCommand } from "./commands/evidence.js";
import { runFinalizeCommand } from "./commands/finalize.js";
import { runInspectCommand } from "./commands/inspect.js";
import { runPlanCommand } from "./commands/plan.js";
import { runResumeCommand } from "./commands/resume.js";
import { runReview } from "./commands/review.js";
import { runStatus } from "./commands/status.js";
import { runVerifyCommand } from "./commands/verify.js";
import { readUadsVersion } from "./lib/version.js";

const program = new Command();

program
  .name("uads")
  .description(
    "UADS - Universal Autonomous Development Studio by NexLabs. Global-first autonomous software engineering orchestration.",
  )
  .version(readUadsVersion());

program
  .command("doctor")
  .description("Check the local environment, git repo, and global UADS installation")
  .action(() => {
    process.stdout.write(runDoctor());
  });

program
  .command("inspect")
  .description("Inspect the current repository and cache a compact map in the sidecar")
  .option("--json", "JSON output")
  .action((options: { json?: boolean }) => {
    process.stdout.write(runInspectCommand({ json: options.json }));
  });

program
  .command("plan")
  .description("Create a Work Order, routing decision, and checkpoint without editing product code")
  .option("--request <text>", "conservative fallback text intake (not the semantic authority)")
  .option("--intake <path>", "path to schema-valid structured intake JSON")
  .option("--json", "JSON output")
  .action((options: { request?: string; intake?: string; json?: boolean }) => {
    process.stdout.write(
      runPlanCommand({
        request: options.request,
        intakePath: options.intake,
        json: options.json,
      }),
    );
  });

program
  .command("dispatch")
  .description("Create a bounded execution run and packet from the current planned Work Order")
  .option("--json", "JSON output")
  .option("--session <id>", "implementer session id")
  .action((options: { json?: boolean; session?: string }) => {
    process.stdout.write(runDispatchCommand({ json: options.json, session: options.session }));
  });

program
  .command("verify")
  .description("Compute the current change digest and enforce execution scope boundaries")
  .option("--json", "JSON output")
  .action((options: { json?: boolean }) => {
    process.stdout.write(runVerifyCommand({ json: options.json }));
  });

const evidence = program.command("evidence").description("Execution evidence ledger");
evidence
  .command("record")
  .description("Record gate evidence bound to the current change digest (does not execute the command)")
  .requiredOption("--gate <id>", "selected gate id")
  .requiredOption("--kind <kind>", "command | file | invariant | review")
  .requiredOption("--role <role>", "source role")
  .option("--command <text>", "command text for command evidence")
  .option("--exit-code <n>", "exit code for command evidence")
  .option("--output <path>", "sanitized output file to copy into the sidecar")
  .option("--file <relative-path>", "relative project file for file/invariant evidence")
  .requiredOption("--summary <text>", "concise evidence summary")
  .option("--status <status>", "PASS | FAIL | BLOCKED (derived from exit code for command evidence)")
  .option("--json", "JSON output")
  .action(
    (options: {
      gate: string;
      kind: string;
      role: string;
      command?: string;
      exitCode?: string;
      output?: string;
      file?: string;
      summary: string;
      status?: string;
      json?: boolean;
    }) => {
      process.stdout.write(
        runEvidenceRecordCommand({
          json: options.json,
          gateId: options.gate,
          kind: options.kind,
          role: options.role,
          command: options.command,
          exitCode: options.exitCode,
          output: options.output,
          file: options.file,
          summary: options.summary,
          status: options.status,
        }),
      );
    },
  );

const assurance = program.command("assurance").description("Independent review start/record (not review ZIP)");
assurance
  .command("start")
  .description("Start independent assurance review after selected non-review gates PASS")
  .option("--json", "JSON output")
  .action((options: { json?: boolean }) => {
    process.stdout.write(runAssuranceStartCommand({ json: options.json }));
  });
assurance
  .command("record")
  .description("Record an independent review verdict bound to the current change digest")
  .requiredOption("--role <role>", "reviewer role")
  .requiredOption("--session <id>", "reviewer session id")
  .requiredOption("--implementer-session <id>", "implementer session id")
  .requiredOption("--verdict <verdict>", "APPROVED | CORRECTION_NEEDED | BLOCKED")
  .requiredOption("--summary <text>", "concise review summary")
  .option("--findings <json>", "JSON array of findings")
  .option("--findings-file <path>", "path to JSON findings array")
  .option("--json", "JSON output")
  .action(
    (options: {
      role: string;
      session: string;
      implementerSession: string;
      verdict: string;
      summary: string;
      findings?: string;
      findingsFile?: string;
      json?: boolean;
    }) => {
      process.stdout.write(
        runAssuranceRecordCommand({
          json: options.json,
          role: options.role,
          session: options.session,
          implementerSession: options.implementerSession,
          verdict: options.verdict,
          summary: options.summary,
          findings: options.findings,
          findingsFile: options.findingsFile,
        }),
      );
    },
  );

program
  .command("finalize")
  .description("Authoritative completion gate for the current execution run")
  .option("--json", "JSON output")
  .action((options: { json?: boolean }) => {
    process.stdout.write(runFinalizeCommand({ json: options.json }));
  });

const context = program.command("context").description("Controlled execution context radius");
context
  .command("expand")
  .description("Expand context radius by one step (C5 remains exceptional)")
  .requiredOption("--reason <text>", "concise expansion reason")
  .option("--approve-c5", "explicitly approve exceptional C5 expansion")
  .option("--json", "JSON output")
  .action((options: { reason: string; approveC5?: boolean; json?: boolean }) => {
    process.stdout.write(
      runContextExpandCommand({
        json: options.json,
        reason: options.reason,
        approveC5: options.approveC5,
      }),
    );
  });

program
  .command("status")
  .description("Show project identity plus latest orchestration and execution state")
  .option("--json", "JSON output")
  .action((options: { json?: boolean }) => {
    process.stdout.write(runStatus(process.cwd(), { json: options.json }));
  });

program
  .command("resume")
  .description("Emit a compact resume packet from sidecar state without rescanning the repository")
  .option("--json", "JSON output")
  .action((options: { json?: boolean }) => {
    process.stdout.write(runResumeCommand({ json: options.json }));
  });

program
  .command("review")
  .description("Generate a review ZIP in the global sidecar workspace (outside the project)")
  .action(async () => {
    process.stdout.write(await runReview());
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`uads: ${message}\n`);
  process.exitCode = 1;
});
