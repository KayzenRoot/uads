import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHA_RE = /^[0-9a-f]{40}$/i;
const REPOSITORY_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SAFE_URL_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/actions\/runs\/[0-9]+$/;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function resolveSecurityWorkflowProofs({ repository, finalCommitSha }) {
  if (!REPOSITORY_RE.test(repository ?? "") || !SHA_RE.test(finalCommitSha ?? "")) {
    return unavailableProofs("SECURITY_PROOF_IDENTITY_MISMATCH");
  }
  const finalRef = api(`repos/${repository}/git/ref/heads/main`);
  const finalCommit = api(`repos/${repository}/git/commits/${finalCommitSha}`);
  const finalTreeSha = safeSha(finalCommit?.tree?.sha);
  const localTreeSha = git(["rev-parse", `${finalCommitSha}^{tree}`]);
  if (finalRef?.object?.sha !== finalCommitSha || !finalTreeSha || finalTreeSha !== localTreeSha) {
    return unavailableProofs("SECURITY_PROOF_IDENTITY_MISMATCH");
  }

  const codeql = resolveExactProof({ repository, workflow: "codeql", workflowFile: "codeql.yml", finalCommitSha, finalTreeSha });
  const scorecard = resolveExactProof({ repository, workflow: "scorecard", workflowFile: "scorecard.yml", finalCommitSha, finalTreeSha });
  const dependencyReview = resolveDependencyReviewProof({ repository, finalCommitSha, finalTreeSha });
  return { codeql, scorecard, dependencyReview, finalTreeSha };
}

function resolveExactProof({ repository, workflow, workflowFile, finalCommitSha, finalTreeSha }) {
  const result = api(`repos/${repository}/actions/workflows/${workflowFile}/runs?per_page=100&head_sha=${finalCommitSha}`);
  const candidates = (result?.workflow_runs ?? []).filter((run) => run?.head_sha === finalCommitSha);
  const completed = candidates.filter((run) => run?.status === "completed").sort((left, right) => Number(right?.id ?? 0) - Number(left?.id ?? 0));
  const run = completed[0] ?? candidates.sort((left, right) => Number(right?.id ?? 0) - Number(left?.id ?? 0))[0];
  if (!run) return unavailableStatus("SECURITY_RUN_UNAVAILABLE");
  if (run.status !== "completed") return unavailableStatus("SECURITY_RUN_PENDING", run);
  const fullRun = api(`repos/${repository}/actions/runs/${run.id}`) ?? run;
  const runId = positive(fullRun.id);
  const runAttempt = positive(fullRun.run_attempt);
  const outcome = normalizeOutcome(fullRun.conclusion);
  const sourceTreeSha = safeSha(finalTreeSha);
  if (!runId || !runAttempt || fullRun.head_sha !== finalCommitSha || fullRun.repository?.full_name && fullRun.repository.full_name !== repository || !SAFE_URL_RE.test(fullRun.html_url ?? "") || !sourceTreeSha || !fullRun.html_url.startsWith(`https://github.com/${repository}/`)) return unavailableStatus("SECURITY_PROOF_IDENTITY_MISMATCH", fullRun);
  const proof = createProof({ workflow, proofMode: "exact-sha", outcome, repository, finalCommitSha, finalTreeSha, sourceCommitSha: finalCommitSha, sourceTreeSha, runId, runAttempt, pullRequestNumber: null, htmlUrl: fullRun.html_url });
  return statusForProof(proof);
}

function resolveDependencyReviewProof({ repository, finalCommitSha, finalTreeSha }) {
  const exact = resolveExactProof({ repository, workflow: "dependency-review", workflowFile: "dependency-review.yml", finalCommitSha, finalTreeSha });
  if (exact.proof || exact.outcome === "failure" || exact.outcome === "cancelled" || exact.outcome === "skipped") return exact;
  return resolveSameTreeDependencyProof({ repository, finalCommitSha, finalTreeSha });
}

function resolveSameTreeDependencyProof({ repository, finalCommitSha, finalTreeSha }) {
  const pullRequests = api(`repos/${repository}/commits/${finalCommitSha}/pulls`, { headers: ["Accept: application/vnd.github+json"] });
  const merged = (Array.isArray(pullRequests) ? pullRequests : []).filter((pr) => pr?.state === "closed" && pr?.merged_at && pr?.merge_commit_sha === finalCommitSha && pr?.base?.ref === "main" && pr?.base?.repo?.full_name === repository);
  if (merged.length !== 1) return unavailableStatus(merged.length === 0 ? "DEPENDENCY_REVIEW_PR_NOT_FOUND" : "DEPENDENCY_REVIEW_PR_AMBIGUOUS");
  const pullRequest = merged[0];
  const sourceCommitSha = safeSha(pullRequest?.head?.sha);
  if (!sourceCommitSha || pullRequest?.head?.repo?.full_name !== repository) return unavailableStatus("DEPENDENCY_REVIEW_SOURCE_SHA_MISMATCH");
  const sourceCommit = api(`repos/${repository}/git/commits/${sourceCommitSha}`);
  const sourceTreeSha = safeSha(sourceCommit?.tree?.sha);
  if (!sourceTreeSha) return unavailableStatus("DEPENDENCY_REVIEW_SOURCE_SHA_MISMATCH");
  if (sourceTreeSha !== finalTreeSha) return unavailableStatus("DEPENDENCY_REVIEW_TREE_MISMATCH");

  const result = api(`repos/${repository}/actions/workflows/dependency-review.yml/runs?per_page=100&head_sha=${sourceCommitSha}`);
  const candidates = (result?.workflow_runs ?? []).map((run) => ({
    id: positive(run?.id),
    headSha: safeSha(run?.head_sha),
    status: typeof run?.status === "string" ? run.status : null,
    conclusion: typeof run?.conclusion === "string" ? run.conclusion : null,
    runAttempt: positive(run?.run_attempt),
    htmlUrl: run?.html_url,
    event: run?.event,
  })).filter((run) => run.id !== null && run.headSha === sourceCommitSha && run.event === "pull_request");
  const completed = candidates.filter((run) => run.status === "completed");
  if (completed.length !== 1) return unavailableStatus(completed.length === 0 ? "DEPENDENCY_REVIEW_RUN_NOT_SUCCESS" : "DEPENDENCY_REVIEW_RUN_AMBIGUOUS");
  const candidate = completed[0];
  if (candidate.conclusion !== "success") return unavailableStatus("DEPENDENCY_REVIEW_RUN_NOT_SUCCESS", candidate);
  const fullRun = api(`repos/${repository}/actions/runs/${candidate.id}`) ?? candidate;
  const runId = positive(fullRun.id);
  const runAttempt = positive(fullRun.run_attempt ?? candidate.runAttempt);
  if (!runId || !runAttempt || fullRun.head_sha !== sourceCommitSha || fullRun.repository?.full_name && fullRun.repository.full_name !== repository || !SAFE_URL_RE.test(fullRun.html_url ?? "") || !fullRun.html_url.startsWith(`https://github.com/${repository}/`)) return unavailableStatus("DEPENDENCY_REVIEW_SOURCE_SHA_MISMATCH", fullRun);
  const proof = createProof({ workflow: "dependency-review", proofMode: "same-tree-pr", outcome: "success", repository, finalCommitSha, finalTreeSha, sourceCommitSha, sourceTreeSha, runId, runAttempt, pullRequestNumber: positive(pullRequest.number), htmlUrl: fullRun.html_url });
  return statusForProof(proof);
}

function createProof(input) {
  const withoutDigest = { ...input };
  const proofDigest = crypto.createHash("sha256").update(JSON.stringify(sortedObject(withoutDigest))).digest("hex");
  return { ...withoutDigest, proofDigest };
}

function statusForProof(proof) {
  return {
    status: proof.outcome,
    outcome: proof.outcome,
    runId: proof.runId,
    runAttempt: proof.runAttempt,
    commitSha: proof.sourceCommitSha,
    htmlUrl: proof.htmlUrl,
    reasonCode: proof.outcome === "success" ? null : "SECURITY_WORKFLOW_NOT_SUCCESS",
    proof,
  };
}

function unavailableProofs(reasonCode) {
  return { codeql: unavailableStatus(reasonCode), scorecard: unavailableStatus(reasonCode), dependencyReview: unavailableStatus(reasonCode), finalTreeSha: null };
}

function unavailableStatus(reasonCode, run = null) {
  return {
    status: run?.status === "completed" ? normalizeOutcome(run.conclusion) : "unknown",
    outcome: run?.status === "completed" ? normalizeOutcome(run.conclusion) : "unknown",
    runId: positive(run?.id),
    runAttempt: positive(run?.run_attempt),
    commitSha: safeSha(run?.head_sha),
    htmlUrl: SAFE_URL_RE.test(run?.html_url ?? "") ? run.html_url : null,
    reasonCode,
  };
}

function sortedObject(value) {
  if (Array.isArray(value)) return value.map(sortedObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, sortedObject(item)]));
}

function api(endpoint, options = {}) {
  const args = ["api", endpoint];
  for (const header of options.headers ?? []) args.push("-H", header);
  const result = spawnSync("gh", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) return null;
  try { return JSON.parse(result.stdout); } catch { return null; }
}

function git(args) {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true }).trim(); } catch { return null; }
}

function safeSha(value) { return typeof value === "string" && SHA_RE.test(value) ? value.toLowerCase() : null; }
function positive(value) { const number = Number(value); return Number.isSafeInteger(number) && number > 0 ? number : null; }
function normalizeOutcome(value) { return ["success", "failure", "cancelled", "skipped"].includes(value) ? value : "unknown"; }
