#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProcess } from "../lib/exec.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const vitestCli = path.join(root, "node_modules", "vitest", "vitest.mjs");
const extra = process.argv.slice(2);
const result = runProcess(process.execPath, [vitestCli, "run", "--maxWorkers=1", ...extra], {
  cwd: root,
  env: process.env,
});

const stdout = result.stdout ?? "";
const stderr = result.stderr ?? "";
process.stdout.write(stdout);
process.stderr.write(stderr);

if ((result.status ?? 1) === 0) {
  process.exit(0);
}

const fileLine = stdout.match(/Test Files\s+(\d+) passed(?:\s+\|\s+(\d+) failed)?\s+\((\d+)\)/);
const testLine = stdout.match(/Tests\s+(\d+) passed(?:\s+\|\s+(\d+) failed)?\s+\((\d+)\)/);
const rpcTimeout = /Timeout calling "onTaskUpdate"/.test(`${stdout}\n${stderr}`);
const failedFiles = fileLine?.[2] ? Number(fileLine[2]) : 0;
const failedTests = testLine?.[2] ? Number(testLine[2]) : 0;
const passedFiles = fileLine ? Number(fileLine[1]) : 0;
const totalFiles = fileLine ? Number(fileLine[3]) : 0;
const incomplete = Boolean(fileLine) && passedFiles !== totalFiles;

if (
  rpcTimeout &&
  fileLine &&
  testLine &&
  failedFiles === 0 &&
  failedTests === 0 &&
  !incomplete &&
  !/\n\s*FAIL\s+/.test(stdout)
) {
  process.stderr.write(
    "uads: Vitest worker RPC timed out after a fully green suite; treating as PASS (Windows pool teardown flake).\n",
  );
  process.exit(0);
}

process.exit(result.status ?? 1);
