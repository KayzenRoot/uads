import { computeProjectFingerprint } from "../lib/fingerprint.js";
import { readGitSummary } from "../lib/git.js";
import { readUadsVersion } from "../lib/version.js";
import { getUadsPaths } from "../lib/workspace.js";
import { readCurrentCheckpoint, readWorkOrder } from "../kernel/persist.js";
import fs from "node:fs";
import path from "node:path";

export function runStatus(cwd: string = process.cwd(), options: { uadsHome?: string; json?: boolean } = {}): string {
  const git = readGitSummary(cwd);
  const repoRoot = git.repoRoot ?? path.resolve(cwd);
  const fingerprint = computeProjectFingerprint({
    originUrl: git.originUrl,
    repoRoot,
  });
  const paths = getUadsPaths(fingerprint.projectId, options.uadsHome);
  const version = readUadsVersion();
  const dirty = git.status !== "(clean)" && git.status.length > 0;
  const checkpoint = fs.existsSync(paths.currentState) ? readCurrentCheckpoint(paths) : null;
  const workOrder =
    checkpoint?.workOrderId && fs.existsSync(paths.workOrders)
      ? readWorkOrder(paths, checkpoint.workOrderId)
      : null;

  if (options.json) {
    return `${JSON.stringify(
      {
        version,
        projectId: fingerprint.projectId,
        fingerprint: fingerprint.fingerprint,
        workspaceExists: fs.existsSync(paths.workspace),
        zeroProjectFootprint: true,
        workingTree: dirty ? "dirty" : "clean",
        workOrderId: workOrder?.workOrderId ?? null,
        phase: checkpoint?.phase ?? null,
        riskLevel: workOrder?.riskLevel ?? null,
        scopeClass: workOrder?.scopeClass ?? null,
        specialists: workOrder?.specialists ?? [],
        gates: workOrder?.qualityGates ?? [],
        nextAction: checkpoint?.nextAction ?? null,
      },
      null,
      2,
    )}\n`;
  }

  return [
    `UADS status v${version}`,
    `branch: ${git.branch ?? "(none)"}`,
    `head: ${git.head ?? "(no commits)"}`,
    `origin: ${git.originUrl ?? "(none)"}`,
    `fingerprintSource: ${fingerprint.source}`,
    `fingerprint: ${fingerprint.fingerprint}`,
    `projectId: ${fingerprint.projectId}`,
    `workspaceExists: ${fs.existsSync(paths.workspace)}`,
    `zeroProjectFootprint: true`,
    `workingTree: ${dirty ? "dirty" : "clean"}`,
    `workOrderId: ${workOrder?.workOrderId ?? "(none)"}`,
    `phase: ${checkpoint?.phase ?? "(none)"}`,
    `riskLevel: ${workOrder?.riskLevel ?? "(none)"}`,
    `scopeClass: ${workOrder?.scopeClass ?? "(none)"}`,
    `specialists: ${workOrder?.specialists.join(", ") || "(none)"}`,
    `gates: ${workOrder?.qualityGates.join(", ") || "(none)"}`,
    `nextAction: ${checkpoint?.nextAction ?? "(none)"}`,
    "",
  ].join("\n");
}
