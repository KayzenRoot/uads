#!/usr/bin/env node
import { Command } from "commander";
import { runDoctor } from "./commands/doctor.js";
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
  .command("status")
  .description("Show project fingerprint, sidecar workspace, and git summary")
  .action(() => {
    process.stdout.write(runStatus());
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
