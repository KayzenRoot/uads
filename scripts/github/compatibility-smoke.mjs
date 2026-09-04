#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveNpmInvocation } from "../lib/exec.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const platform = valueOf("--platform");
if (platform !== "linux" && platform !== "windows") fail("--platform must be linux or windows");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "uads-compatibility-smoke-"));
try {
  const packDirectory = path.join(scratch, "pack");
  const prefix = path.join(scratch, "global");
  const home = path.join(scratch, "uads-home");
  fs.mkdirSync(packDirectory, { recursive: true });
  const npm = resolveNpmInvocation();
  const npmArgs = (args) => [...npm.argsPrefix, ...args];
  const packed = execFileSync(npm.command, npmArgs(["pack", "--pack-destination", packDirectory, "--json"]), { cwd: root, encoding: "utf8", timeout: 120000, windowsHide: true });
  const packResult = JSON.parse(packed);
  const filename = packResult?.[0]?.filename;
  if (typeof filename !== "string" || !/^[A-Za-z0-9._-]+\.tgz$/.test(filename)) fail("packaging smoke did not return a bounded tarball name");
  const tarball = path.join(packDirectory, filename);
  execFileSync(npm.command, npmArgs(["install", "--ignore-scripts", "--prefix", prefix, tarball]), { cwd: root, encoding: "utf8", timeout: 120000, windowsHide: true, stdio: "pipe" });
  const cli = path.join(prefix, "node_modules", "uads", "dist", "cli.js");
  const help = execFileSync(process.execPath, [cli, "--help"], { cwd: root, encoding: "utf8", timeout: 30000, windowsHide: true, env: { ...process.env, UADS_HOME: home } });
  if (!help.includes("assurance") || !help.includes("adapters")) fail("isolated global CLI smoke did not expose expected commands");
  process.stdout.write(`compatibility smoke PASS ${platform}\n`);
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}

function valueOf(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
