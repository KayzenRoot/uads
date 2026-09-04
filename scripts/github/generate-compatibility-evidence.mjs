#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const { assertSchema } = await import("../../dist/lib/json-schema.js");
const output = path.resolve(valueOf("--output") ?? path.join(process.env.RUNNER_TEMP ?? path.join(root, "tmp"), "uads-compatibility-evidence.json"));
const platform = valueOf("--platform");
const status = process.env.UADS_COMPATIBILITY_STATUS;
const sha = process.env.GITHUB_SHA;
if ((platform !== "linux" && platform !== "windows") || !/^[0-9a-f]{40}$/i.test(sha ?? "")) fail("bounded compatibility identity is incomplete");
const outcome = status === "success" ? "success" : status === "cancelled" ? "cancelled" : "failure";
const evidence = {
  schema: "uads.compatibility-evidence",
  schemaVersion: "0.1.0",
  platform,
  nodeMajor: 20,
  commitSha: sha.toLowerCase(),
  workflowRunId: positive(process.env.GITHUB_RUN_ID),
  workflowRunAttempt: positive(process.env.GITHUB_RUN_ATTEMPT),
  outcome,
  reasonCode: outcome === "success" ? null : "COMPATIBILITY_JOB_NOT_SUCCESS",
};
try { assertSchema("compatibility-evidence.schema.json", evidence, root); }
catch (error) { fail(error instanceof Error ? error.message : String(error)); }
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(evidence)}\n`);

function valueOf(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; }
function positive(value) { const number = Number(value); return Number.isSafeInteger(number) && number > 0 ? number : null; }
function fail(message) { process.stderr.write(`${message}\n`); process.exit(1); }
