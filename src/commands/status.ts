import { computeProjectFingerprint } from "../lib/fingerprint.js";
import { readGitSummary } from "../lib/git.js";
import { readUadsVersion } from "../lib/version.js";
import { getUadsPaths } from "../lib/workspace.js";
import { loadExecutionView } from "../kernel/execution.js";
import { readCurrentCheckpoint, readContextPlan, readWorkOrder } from "../kernel/persist.js";
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
  const contextPlan = fs.existsSync(paths.workspace) ? readContextPlan(paths) : null;
  const execution = fs.existsSync(paths.workspace)
    ? loadExecutionView({ cwd, uadsHome: options.uadsHome })
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
        nextAction: execution?.executionRunId ? execution.nextAction : checkpoint?.nextAction ?? null,
        executionRunId: execution?.executionRunId ?? null,
        attempt: execution?.attempt ?? null,
        changeDigest: execution?.changeDigest ?? null,
        pendingGates: execution?.pendingGates ?? [],
        failedGates: execution?.failedGates ?? [],
        requiredReviewers: execution?.requiredReviewers ?? [],
        completedReviewers: execution?.completedReviewers ?? [],
        contextPackId: contextPlan?.contextPackId ?? null,
        indexDigest: contextPlan?.indexDigest ?? null,
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
    `executionRunId: ${execution?.executionRunId ?? "(none)"}`,
    `phase: ${checkpoint?.phase ?? "(none)"}`,
    `executionStatus: ${execution?.status ?? "(none)"}`,
    `attempt: ${execution?.attempt ?? "(none)"}`,
    `changeDigest: ${execution?.changeDigest ?? "(none)"}`,
    `riskLevel: ${workOrder?.riskLevel ?? "(none)"}`,
    `scopeClass: ${workOrder?.scopeClass ?? "(none)"}`,
    `specialists: ${workOrder?.specialists.join(", ") || "(none)"}`,
    `gates: ${workOrder?.qualityGates.join(", ") || "(none)"}`,
    `pendingGates: ${execution?.pendingGates.join(", ") || "(none)"}`,
    `nextAction: ${execution?.executionRunId ? execution.nextAction : checkpoint?.nextAction ?? "(none)"}`,
    "",
  ].join("\n");
}
