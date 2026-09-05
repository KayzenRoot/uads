import crypto from "node:crypto";

export const SECURITY_PROOF_SCHEMA_VERSION = "0.9.0" as const;
export const LEGACY_SECURITY_PROOF_SCHEMA_VERSION = "0.8.0" as const;

export type SecurityWorkflowName = "codeql" | "scorecard" | "dependency-review";
export type SecurityProofMode = "exact-sha" | "same-tree-pr";
export type SecurityProofOutcome = "success" | "failure" | "cancelled" | "skipped" | "unknown";

export type SecurityWorkflowProof = {
  workflow: SecurityWorkflowName;
  proofMode: SecurityProofMode;
  outcome: SecurityProofOutcome;
  repository: string;
  finalCommitSha: string;
  finalTreeSha: string;
  sourceCommitSha: string;
  sourceTreeSha: string;
  runId: number;
  runAttempt: number;
  pullRequestNumber: number | null;
  htmlUrl: string;
  proofDigest: string;
};

export type SecurityWorkflowStatusKey = "codeql" | "scorecard" | "dependencyReview";
export type SecurityWorkflowStatuses = Partial<Record<SecurityWorkflowStatusKey, { outcome?: unknown; proof?: unknown }>>;

export type SecurityProofExpectation = {
  workflow?: SecurityWorkflowName;
  repository?: string | null;
  finalCommitSha?: string | null;
  finalTreeSha?: string | null;
  sourceCommitSha?: string | null;
};

const SHA_RE = /^[0-9a-f]{40}$/i;
const DIGEST_RE = /^[0-9a-f]{64}$/i;
const REPOSITORY_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const URL_RE = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\/actions\/runs\/([0-9]+)$/;
const OUTCOMES = new Set<SecurityProofOutcome>(["success", "failure", "cancelled", "skipped", "unknown"]);
const WORKFLOWS = new Set<SecurityWorkflowName>(["codeql", "scorecard", "dependency-review"]);

export function isCorrectedReleaseVersion(version: string | null | undefined): boolean {
  if (typeof version !== "string") return false;
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-|\+|$)/.exec(version);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  return major > 0 || minor > 11 || (minor === 11 && patch >= 1);
}

function sortedObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, sortedObject(item)]),
  );
}

export function computeSecurityWorkflowProofDigest(
  proof: Omit<SecurityWorkflowProof, "proofDigest"> | SecurityWorkflowProof,
): string {
  const { proofDigest: _ignored, ...withoutDigest } = proof as SecurityWorkflowProof;
  return crypto.createHash("sha256").update(JSON.stringify(sortedObject(withoutDigest))).digest("hex");
}

export function createSecurityWorkflowProof(
  input: Omit<SecurityWorkflowProof, "proofDigest">,
): SecurityWorkflowProof {
  const proof = { ...input, proofDigest: "" } as SecurityWorkflowProof;
  proof.proofDigest = computeSecurityWorkflowProofDigest(proof);
  return proof;
}

export function normalizeSecurityWorkflowProof(value: unknown): SecurityWorkflowProof | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Partial<SecurityWorkflowProof>;
  const workflow = WORKFLOWS.has(item.workflow as SecurityWorkflowName) ? item.workflow as SecurityWorkflowName : null;
  const proofMode = item.proofMode === "exact-sha" || item.proofMode === "same-tree-pr" ? item.proofMode : null;
  const outcome = OUTCOMES.has(item.outcome as SecurityProofOutcome) ? item.outcome as SecurityProofOutcome : null;
  const repository = typeof item.repository === "string" && REPOSITORY_RE.test(item.repository) ? item.repository : null;
  const sha = (candidate: unknown): string | null => typeof candidate === "string" && SHA_RE.test(candidate) ? candidate.toLowerCase() : null;
  const positive = (candidate: unknown): number | null => typeof candidate === "number" && Number.isSafeInteger(candidate) && candidate > 0 ? candidate : null;
  const pullRequestNumber = item.pullRequestNumber === null ? null : positive(item.pullRequestNumber);
  const htmlUrl = typeof item.htmlUrl === "string" && URL_RE.test(item.htmlUrl) ? item.htmlUrl : null;
  const proofDigest = typeof item.proofDigest === "string" && DIGEST_RE.test(item.proofDigest) ? item.proofDigest.toLowerCase() : null;
  if (!workflow || !proofMode || !outcome || !repository || !sha(item.finalCommitSha) || !sha(item.finalTreeSha) || !sha(item.sourceCommitSha) || !sha(item.sourceTreeSha) || !positive(item.runId) || !positive(item.runAttempt) || (item.pullRequestNumber !== null && pullRequestNumber === null) || !htmlUrl || !proofDigest) return null;
  return {
    workflow,
    proofMode,
    outcome,
    repository,
    finalCommitSha: sha(item.finalCommitSha)!,
    finalTreeSha: sha(item.finalTreeSha)!,
    sourceCommitSha: sha(item.sourceCommitSha)!,
    sourceTreeSha: sha(item.sourceTreeSha)!,
    runId: positive(item.runId)!,
    runAttempt: positive(item.runAttempt)!,
    pullRequestNumber,
    htmlUrl,
    proofDigest,
  };
}

export function validateSecurityWorkflowProof(
  value: unknown,
  expectation: SecurityProofExpectation = {},
): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["SECURITY_PROOF_IDENTITY_MISMATCH"];
  const item = value as Partial<SecurityWorkflowProof>;
  const allowed = ["workflow", "proofMode", "outcome", "repository", "finalCommitSha", "finalTreeSha", "sourceCommitSha", "sourceTreeSha", "runId", "runAttempt", "pullRequestNumber", "htmlUrl", "proofDigest"];
  if (Object.keys(item).some((key) => !allowed.includes(key))) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  if (!WORKFLOWS.has(item.workflow as SecurityWorkflowName)) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  if (!(["exact-sha", "same-tree-pr"] as unknown[]).includes(item.proofMode)) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  if (!OUTCOMES.has(item.outcome as SecurityProofOutcome)) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  if (typeof item.repository !== "string" || !REPOSITORY_RE.test(item.repository)) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  for (const key of ["finalCommitSha", "finalTreeSha", "sourceCommitSha", "sourceTreeSha"] as const) {
    if (!SHA_RE.test(item[key] ?? "")) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  }
  if (!Number.isSafeInteger(item.runId) || (item.runId ?? 0) <= 0 || !Number.isSafeInteger(item.runAttempt) || (item.runAttempt ?? 0) <= 0) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  if (item.pullRequestNumber !== null && (!Number.isSafeInteger(item.pullRequestNumber) || (item.pullRequestNumber ?? 0) <= 0)) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  const urlMatch = typeof item.htmlUrl === "string" ? URL_RE.exec(item.htmlUrl) : null;
  if (!urlMatch || urlMatch[1] !== item.repository || Number(urlMatch[2]) !== item.runId) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  if (!DIGEST_RE.test(item.proofDigest ?? "") || computeSecurityWorkflowProofDigest(item as SecurityWorkflowProof) !== item.proofDigest) errors.push("SECURITY_PROOF_DIGEST_MISMATCH");

  if (expectation.workflow && item.workflow !== expectation.workflow) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  if (expectation.repository && item.repository !== expectation.repository) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  if (expectation.finalCommitSha && item.finalCommitSha !== expectation.finalCommitSha.toLowerCase()) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  if (expectation.finalTreeSha && item.finalTreeSha !== expectation.finalTreeSha.toLowerCase()) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  if (expectation.sourceCommitSha && item.sourceCommitSha !== expectation.sourceCommitSha.toLowerCase()) errors.push("DEPENDENCY_REVIEW_SOURCE_SHA_MISMATCH");
  if (item.workflow === "codeql" || item.workflow === "scorecard") {
    if (item.proofMode !== "exact-sha" || item.pullRequestNumber !== null || item.sourceCommitSha !== item.finalCommitSha || item.sourceTreeSha !== item.finalTreeSha) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
  }
  if (item.workflow === "dependency-review") {
    if (item.proofMode === "exact-sha" && (item.pullRequestNumber !== null || item.sourceCommitSha !== item.finalCommitSha || item.sourceTreeSha !== item.finalTreeSha)) errors.push("SECURITY_PROOF_IDENTITY_MISMATCH");
    if (item.proofMode === "same-tree-pr") {
      if (item.pullRequestNumber === null || item.sourceTreeSha !== item.finalTreeSha) errors.push("DEPENDENCY_REVIEW_TREE_MISMATCH");
    }
  }
  return [...new Set(errors)];
}

export function securityWorkflowAuthorizationErrors(
  statuses: SecurityWorkflowStatuses,
  expectation: { repository?: string | null; finalCommitSha?: string | null; finalTreeSha?: string | null } = {},
): string[] {
  const errors: string[] = [];
  const entries: Array<[SecurityWorkflowName, SecurityWorkflowStatusKey, string]> = [
    ["codeql", "codeql", "CODEQL_NOT_PROVEN"],
    ["scorecard", "scorecard", "SCORECARD_NOT_PROVEN"],
    ["dependency-review", "dependencyReview", "DEPENDENCY_REVIEW_NOT_PROVEN"],
  ];
  for (const [workflow, statusKey, reason] of entries) {
    const status = statuses[statusKey];
    const proof = status?.proof;
    if (!proof) {
      errors.push(reason);
      continue;
    }
    const proofErrors = validateSecurityWorkflowProof(proof, {
      workflow,
      repository: expectation.repository,
      finalCommitSha: expectation.finalCommitSha,
      finalTreeSha: expectation.finalTreeSha,
    });
    if (proofErrors.length > 0) errors.push(...proofErrors, reason);
    if (proof && typeof proof === "object" && (proof as Partial<SecurityWorkflowProof>).outcome !== "success") errors.push(reason);
  }
  return [...new Set(errors)];
}

export type SecurityRunCandidate = {
  id: number;
  headSha: string | null;
  status: string | null;
  conclusion: string | null;
  runAttempt: number | null;
};

export function selectUniqueDependencyReviewRun(
  candidates: SecurityRunCandidate[],
  expectedHeadSha: string,
): { run: SecurityRunCandidate | null; reasonCode: string | null } {
  const matching = candidates.filter((run) => run.headSha === expectedHeadSha && run.status === "completed");
  if (matching.length === 0) return { run: null, reasonCode: "DEPENDENCY_REVIEW_RUN_NOT_SUCCESS" };
  if (matching.length !== 1) return { run: null, reasonCode: "DEPENDENCY_REVIEW_RUN_AMBIGUOUS" };
  if (matching[0]?.conclusion !== "success") return { run: null, reasonCode: "DEPENDENCY_REVIEW_RUN_NOT_SUCCESS" };
  return { run: matching[0] ?? null, reasonCode: null };
}
