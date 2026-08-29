#!/usr/bin/env node
import { Command } from "commander";
import { runDoctor } from "./commands/doctor.js";
import { runInspectCommand } from "./commands/inspect.js";
import { runPlanCommand } from "./commands/plan.js";
import { runResumeCommand } from "./commands/resume.js";
import { runReview } from "./commands/review.js";
import { runStatus } from "./commands/status.js";
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
  .command("status")
  .description("Show project identity plus latest orchestration state")
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
