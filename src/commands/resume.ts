import { runResume } from "../kernel/orchestrator.js";

export function runResumeCommand(input: { cwd?: string; uadsHome?: string; json?: boolean } = {}): string {
  const packet = runResume(input);
  if (input.json) {
    return `${JSON.stringify(packet, null, 2)}\n`;
  }
  return [
    "UADS resume",
    `projectId: ${packet.projectId}`,
    `workOrderId: ${packet.workOrderId ?? "(none)"}`,
    `phase: ${packet.phase ?? "(none)"}`,
    `status: ${packet.status}`,
    `objective: ${packet.objective ?? "(none)"}`,
    `scopeClass: ${packet.scopeClass ?? "(none)"}`,
    `riskLevel: ${packet.riskLevel ?? "(none)"}`,
    `specialists: ${packet.specialists.join(", ") || "(none)"}`,
    `gates: ${packet.gates.join(", ") || "(none)"}`,
    `repositoryMapDigest: ${packet.repositoryMapDigest ?? "(none)"}`,
    `nextAction: ${packet.nextAction}`,
    packet.invalidState ? `invalidState: ${packet.invalidState}` : "",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n")
    .concat("\n");
}
