import { computeProjectFingerprint } from "../lib/fingerprint.js";
import { readGitSummary } from "../lib/git.js";
import { readUadsVersion } from "../lib/version.js";
import { getUadsPaths } from "../lib/workspace.js";
import fs from "node:fs";
import path from "node:path";

export function runStatus(cwd: string = process.cwd()): string {
  const git = readGitSummary(cwd);
  const repoRoot = git.repoRoot ?? path.resolve(cwd);
  const fingerprint = computeProjectFingerprint({
    originUrl: git.originUrl,
    repoRoot,
  });
  const paths = getUadsPaths(fingerprint.projectId);
  const version = readUadsVersion();
  const dirty = git.status !== "(clean)" && git.status.length > 0;

  return [
    `UADS status v${version}`,
    `repoRoot: ${repoRoot}`,
    `branch: ${git.branch ?? "(none)"}`,
    `head: ${git.head ?? "(no commits)"}`,
    `origin: ${git.originUrl ?? "(none)"}`,
    `fingerprintSource: ${fingerprint.source}`,
    `fingerprint: ${fingerprint.fingerprint}`,
    `projectId: ${fingerprint.projectId}`,
    `workspace: ${paths.workspace}`,
    `workspaceExists: ${fs.existsSync(paths.workspace)}`,
    `zeroProjectFootprint: true`,
    `workingTree: ${dirty ? "dirty" : "clean"}`,
    "",
  ].join("\n");
}
