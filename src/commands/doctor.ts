import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { computeProjectFingerprint } from "../lib/fingerprint.js";
import { gitAvailable, readGitSummary } from "../lib/git.js";
import { readUadsVersion } from "../lib/version.js";
import { ensureGlobalLayout, getUadsPaths } from "../lib/workspace.js";

export function runDoctor(cwd: string = process.cwd()): string {
  const git = readGitSummary(cwd);
  const repoRoot = git.repoRoot ?? path.resolve(cwd);
  const fingerprint = computeProjectFingerprint({
    originUrl: git.originUrl,
    repoRoot,
  });
  const home = ensureGlobalLayout();
  const paths = getUadsPaths(fingerprint.projectId);
  const version = readUadsVersion();

  const checks = [
    { name: "node", ok: true, detail: process.version },
    { name: "git", ok: git.available, detail: gitAvailable() ? "available" : "not found on PATH" },
    { name: "git-repository", ok: Boolean(git.repoRoot), detail: git.repoRoot ?? "not detected from cwd" },
    { name: "uads-home", ok: fs.existsSync(home), detail: home },
    {
      name: "global-layout",
      ok: ["core", "skills", "agents", "adapters", "cache", "workspaces"].every((dir) =>
        fs.existsSync(path.join(home, dir)),
      ),
      detail: home,
    },
    {
      name: "sidecar-workspace",
      ok: true,
      detail: fs.existsSync(paths.workspace)
        ? paths.workspace
        : `${paths.workspace} (not created yet; created on review)`,
    },
  ];

  const failed = checks.filter((check) => !check.ok);
  const lines = [
    `UADS doctor v${version}`,
    `host: ${os.platform()} ${os.release()}`,
    `projectId: ${fingerprint.projectId}`,
    "",
    ...checks.map((check) => `${check.ok ? "ok  " : "FAIL"} ${check.name}: ${check.detail}`),
    "",
    failed.length === 0 ? "All foundation checks passed." : `${failed.length} check(s) need attention.`,
    "",
  ];

  return lines.join("\n");
}
