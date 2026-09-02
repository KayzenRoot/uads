export const REVIEW_INDEX_SCHEMA = "uads.github-review-index" as const;
export const REVIEW_INDEX_SCHEMA_VERSION = "0.8.0" as const;

export type GithubReviewIndex = {
  schema: typeof REVIEW_INDEX_SCHEMA;
  schemaVersion: typeof REVIEW_INDEX_SCHEMA_VERSION;
  repository: string;
  version: string;
  commitSha: string;
  gitTreeSha: string;
  ciRunId: number | null;
  ciRunAttempt: number | null;
  directReviewRunId: number | null;
  directReviewArtifactName: string | null;
  directReviewEvidenceSha256: string | null;
  codeqlRunId: number | null;
  codeqlStatus: string;
  scorecardRunId: number | null;
  scorecardStatus: string;
  releaseRunId: number | null;
  tag: string;
  expectedTagTargetSha: string | null;
  releaseAssetNames: string[];
};

const SHA_RE = /^[0-9a-f]{40}$/i;
const DIGEST_RE = /^[0-9a-f]{64}$/i;
const REPOSITORY_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SAFE_PATH_RE = /^[A-Za-z0-9._/-]+$/;
const STATUSES = new Set(["success", "failure", "cancelled", "skipped", "pending", "unavailable", "not-evaluated-here", "unknown"]);

export function createGithubReviewIndex(input: Partial<GithubReviewIndex>): GithubReviewIndex {
  const repository = input.repository ?? "";
  const commitSha = input.commitSha ?? "";
  const gitTreeSha = input.gitTreeSha ?? "";
  const tag = input.tag ?? "";
  if (!REPOSITORY_RE.test(repository) || !SHA_RE.test(commitSha) || !SHA_RE.test(gitTreeSha) || !/^v[0-9]/.test(tag)) throw new Error("GitHub review index identity is invalid");
  for (const status of [input.codeqlStatus, input.scorecardStatus]) if (!status || !STATUSES.has(status)) throw new Error("GitHub review index security status is invalid");
  const releaseAssetNames = [...new Set((input.releaseAssetNames ?? []).filter((name): name is string => SAFE_PATH_RE.test(name) && !name.includes("..")))].sort((a, b) => a.localeCompare(b));
  const result: GithubReviewIndex = {
    schema: REVIEW_INDEX_SCHEMA,
    schemaVersion: REVIEW_INDEX_SCHEMA_VERSION,
    repository,
    version: input.version ?? "0.8.0",
    commitSha,
    gitTreeSha,
    ciRunId: positiveOrNull(input.ciRunId),
    ciRunAttempt: positiveOrNull(input.ciRunAttempt),
    directReviewRunId: positiveOrNull(input.directReviewRunId),
    directReviewArtifactName: safePath(input.directReviewArtifactName),
    directReviewEvidenceSha256: input.directReviewEvidenceSha256 && DIGEST_RE.test(input.directReviewEvidenceSha256) ? input.directReviewEvidenceSha256.toLowerCase() : null,
    codeqlRunId: positiveOrNull(input.codeqlRunId),
    codeqlStatus: input.codeqlStatus ?? "unknown",
    scorecardRunId: positiveOrNull(input.scorecardRunId),
    scorecardStatus: input.scorecardStatus ?? "unknown",
    releaseRunId: positiveOrNull(input.releaseRunId),
    tag,
    expectedTagTargetSha: input.expectedTagTargetSha && SHA_RE.test(input.expectedTagTargetSha) ? input.expectedTagTargetSha.toLowerCase() : null,
    releaseAssetNames,
  };
  validateGithubReviewIndex(result);
  return result;
}

export function validateGithubReviewIndex(value: unknown): asserts value is GithubReviewIndex {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("GitHub review index is not an object");
  const item = value as Partial<GithubReviewIndex>;
  const expected = ["schema", "schemaVersion", "repository", "version", "commitSha", "gitTreeSha", "ciRunId", "ciRunAttempt", "directReviewRunId", "directReviewArtifactName", "directReviewEvidenceSha256", "codeqlRunId", "codeqlStatus", "scorecardRunId", "scorecardStatus", "releaseRunId", "tag", "expectedTagTargetSha", "releaseAssetNames"];
  if (Object.keys(item).some((key) => !expected.includes(key))) throw new Error("GitHub review index contains additional properties");
  if (item.schema !== REVIEW_INDEX_SCHEMA || item.schemaVersion !== REVIEW_INDEX_SCHEMA_VERSION || typeof item.repository !== "string" || !REPOSITORY_RE.test(item.repository) || typeof item.commitSha !== "string" || !SHA_RE.test(item.commitSha) || typeof item.gitTreeSha !== "string" || !SHA_RE.test(item.gitTreeSha) || typeof item.version !== "string" || typeof item.tag !== "string" || !/^v[0-9]/.test(item.tag) || !STATUSES.has(item.codeqlStatus ?? "") || !STATUSES.has(item.scorecardStatus ?? "") || !Array.isArray(item.releaseAssetNames) || item.releaseAssetNames.some((name) => typeof name !== "string" || !SAFE_PATH_RE.test(name) || name.includes(".."))) throw new Error("GitHub review index is invalid");
  for (const key of ["ciRunId", "ciRunAttempt", "directReviewRunId", "codeqlRunId", "scorecardRunId", "releaseRunId"] as const) if (item[key] !== null && item[key] !== undefined && !positiveOrNull(item[key])) throw new Error("GitHub review index run identity is invalid");
  if (item.directReviewArtifactName !== null && !safePath(item.directReviewArtifactName)) throw new Error("GitHub review index artifact name is invalid");
  if (item.directReviewEvidenceSha256 !== null && !DIGEST_RE.test(item.directReviewEvidenceSha256 ?? "")) throw new Error("GitHub review index evidence digest is invalid");
  if (item.expectedTagTargetSha !== null && !SHA_RE.test(item.expectedTagTargetSha ?? "")) throw new Error("GitHub review index tag target is invalid");
}

function positiveOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}
function safePath(value: unknown): string | null {
  return typeof value === "string" && value.length <= 240 && SAFE_PATH_RE.test(value) && !value.includes("..") && !value.startsWith("/") && !/^[A-Za-z]:/.test(value) ? value : null;
}
