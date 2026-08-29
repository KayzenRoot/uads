import archiver from "archiver";
import fs from "node:fs";
import path from "node:path";
import { MAX_REVIEW_FILE_BYTES } from "./constants.js";
import { listSidecarEvidence, EVIDENCE_FILE_NAMES } from "./evidence.js";
import { isBinaryFileName, shouldExcludeFromReview } from "./exclusions.js";
import { computeProjectFingerprint } from "./fingerprint.js";
import { readGitSummary } from "./git.js";
import { sha256Hex, toPosix } from "./hash.js";
import { inspectReviewBundle } from "./inspect-review.js";
import { sanitizeRemoteUrl } from "./sanitize-url.js";
import { sanitizeReviewText } from "./secrets.js";
import { readUadsVersion } from "./version.js";
import { ensureWorkspace, readOrCreateProfile } from "./workspace.js";

export type ReviewManifest = {
  schema: "uads.review-manifest";
  schemaVersion: "0.1.0";
  generatedAt: string;
  uadsVersion: string;
  projectId: string;
  fingerprint: string;
  fingerprintSource: "remote" | "path";
  repositoryName: string;
  sidecar: string;
  zipFileName: string;
  git: {
    branch: string | null;
    head: string | null;
    originUrl: string | null;
    hasCommits: boolean;
  };
  includedFiles: string[];
  skipped: Array<{ path: string; reason: string }>;
  evidenceIncluded: string[];
  exclusions: string[];
  inspection: {
    ok: boolean;
    errors: string[];
  };
};

export type ReviewBundleResult = {
  zipPath: string;
  checksumPath: string;
  sha256: string;
  manifest: ReviewManifest;
};

export function walkProjectFiles(repoRoot: string): string[] {
  const files: string[] = [];

  const visit = (absDir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const abs = path.join(absDir, entry.name);
      const rel = toPosix(path.relative(repoRoot, abs));
      if (shouldExcludeFromReview(rel)) {
        continue;
      }

      if (entry.isDirectory()) {
        visit(abs);
        continue;
      }

      if (entry.isFile()) {
        files.push(rel);
      }
    }
  };

  visit(repoRoot);
  return files.sort((a, b) => a.localeCompare(b));
}

export function buildRepositoryTree(files: string[]): string {
  return files.length === 0 ? "(empty)\n" : `${files.join("\n")}\n`;
}

function classifySkip(rel: string, repoRoot: string): string | null {
  if (shouldExcludeFromReview(rel)) {
    return "excluded-pattern";
  }
  if (isBinaryFileName(rel)) {
    return "binary-extension";
  }

  const abs = path.join(repoRoot, rel);
  try {
    const stat = fs.statSync(abs);
    if (stat.size > MAX_REVIEW_FILE_BYTES) {
      return `too-large:${stat.size}`;
    }
  } catch {
    return "unreadable";
  }

  return null;
}

function prepareText(text: string): { include: true; text: string } | { include: false; reason: string } {
  const result = sanitizeReviewText(text);
  if (result.omit) {
    return { include: false, reason: "omitted-unsanitizable-secret" };
  }
  return { include: true, text: result.text };
}

export async function createReviewBundle(input: {
  cwd?: string;
  uadsHome?: string;
  uadsPackageRoot?: string;
  requireEvidence?: boolean;
  forbiddenSubstrings?: string[];
}): Promise<ReviewBundleResult> {
  const cwd = path.resolve(input.cwd ?? process.cwd());
  const git = readGitSummary(cwd);
  const repoRoot = git.repoRoot ?? cwd;
  const fingerprint = computeProjectFingerprint({
    originUrl: git.originUrl,
    repoRoot,
  });
  const paths = ensureWorkspace(fingerprint.projectId, input.uadsHome);
  readOrCreateProfile(paths, {
    projectId: fingerprint.projectId,
    fingerprint: fingerprint.fingerprint,
    fingerprintSource: fingerprint.source,
    repoRoot,
  });

  const generatedAt = new Date().toISOString();
  const stamp = generatedAt.replace(/[:.]/g, "-");
  const zipFileName = `uads-review-${fingerprint.projectId}-${stamp}.zip`;
  const zipPath = path.join(paths.reviews, zipFileName);
  const checksumPath = `${zipPath}.sha256`;
  const repositoryName = path.basename(repoRoot) || "repository";

  const candidates = walkProjectFiles(repoRoot);
  const includedFiles: string[] = [];
  const skipped: Array<{ path: string; reason: string }> = [];
  const projectTexts = new Map<string, string>();

  for (const rel of candidates) {
    const reason = classifySkip(rel, repoRoot);
    if (reason) {
      skipped.push({ path: rel, reason });
      continue;
    }

    const abs = path.join(repoRoot, rel);
    let raw: string;
    try {
      raw = fs.readFileSync(abs, "utf8");
    } catch {
      skipped.push({ path: rel, reason: "unreadable" });
      continue;
    }

    const prepared = prepareText(raw);
    if (!prepared.include) {
      skipped.push({ path: rel, reason: prepared.reason });
      continue;
    }
    includedFiles.push(rel);
    projectTexts.set(rel, prepared.text);
  }

  const gitStatus = prepareText(git.status);
  const gitDiff = prepareText(git.diff);
  const gitLog = prepareText(git.log);
  const treePrepared = prepareText(buildRepositoryTree(candidates));

  const evidenceFiles = listSidecarEvidence(paths.evidence);
  const evidenceIncluded: string[] = [];
  const evidenceTexts = new Map<string, string>();
  for (const file of evidenceFiles) {
    const prepared = prepareText(file.content);
    if (!prepared.include) {
      skipped.push({ path: `evidence/${file.name}`, reason: prepared.reason });
      continue;
    }
    evidenceIncluded.push(file.name);
    evidenceTexts.set(file.name, prepared.text);
  }

  const uadsVersion = readUadsVersion(input.uadsPackageRoot);
  const originUrl = sanitizeRemoteUrl(git.originUrl);

  const manifestBase: Omit<ReviewManifest, "inspection"> = {
    schema: "uads.review-manifest",
    schemaVersion: "0.1.0",
    generatedAt,
    uadsVersion,
    projectId: fingerprint.projectId,
    fingerprint: fingerprint.fingerprint,
    fingerprintSource: fingerprint.source,
    repositoryName,
    sidecar: `sidecar://workspaces/${fingerprint.projectId}`,
    zipFileName,
    git: {
      branch: git.branch,
      head: git.head,
      originUrl,
      hasCommits: Boolean(git.head),
    },
    includedFiles,
    skipped,
    evidenceIncluded,
    exclusions: [
      "node_modules/",
      ".git/",
      "dist/",
      "coverage/",
      "memory-bank/",
      ".env*",
      "secrets/credentials/private keys/tokens",
      "review output directories",
      "absolute local paths in shareable manifest",
      "common binary and cache artifacts",
    ],
  };

  const readme = [
    "UADS review bundle",
    `generatedAt: ${generatedAt}`,
    `projectId: ${fingerprint.projectId}`,
    `repositoryName: ${repositoryName}`,
    `uadsVersion: ${uadsVersion}`,
    "Shareable manifests are privacy-minimized and do not include host paths.",
    "Secrets, .git, node_modules, caches, memory-bank, and review outputs are excluded or redacted.",
    "Content scanning is defense-in-depth and is not a guarantee of complete secret detection.",
    "",
  ].join("\n");

  await writeZip(zipPath, {
    manifest: { ...manifestBase, inspection: { ok: false, errors: [] } },
    tree: treePrepared.include ? treePrepared.text : "(omitted)\n",
    gitStatus: gitStatus.include ? gitStatus.text : "(omitted)\n",
    gitDiff: gitDiff.include ? gitDiff.text : "(omitted)\n",
    gitLog: gitLog.include ? gitLog.text : "(omitted)\n",
    readme,
    includedFiles,
    projectTexts,
    evidenceTexts,
    uadsVersion,
  });

  const inspection = await inspectReviewBundle(zipPath, {
    requireEvidence:
      input.requireEvidence ?? EVIDENCE_FILE_NAMES.every((name) => evidenceIncluded.includes(name)),
    forbiddenSubstrings: input.forbiddenSubstrings,
  }).catch((error: unknown): { ok: false; errors: string[] } => ({
    ok: false,
    errors: [`inspect-failed:${error instanceof Error ? error.message : "unknown"}`],
  }));

  const manifest: ReviewManifest = {
    ...manifestBase,
    inspection,
  };

  const preparedManifest = prepareText(`${JSON.stringify(manifest, null, 2)}\n`);
  if (!preparedManifest.include) {
    throw new Error("review manifest could not be sanitized");
  }

  await writeZip(zipPath, {
    manifest,
    tree: treePrepared.include ? treePrepared.text : "(omitted)\n",
    gitStatus: gitStatus.include ? gitStatus.text : "(omitted)\n",
    gitDiff: gitDiff.include ? gitDiff.text : "(omitted)\n",
    gitLog: gitLog.include ? gitLog.text : "(omitted)\n",
    readme,
    includedFiles,
    projectTexts,
    evidenceTexts,
    uadsVersion,
    manifestText: preparedManifest.text,
  });

  const sha256 = sha256Hex(fs.readFileSync(zipPath));
  fs.writeFileSync(checksumPath, `${sha256}  ${zipFileName}\n`, "utf8");

  return { zipPath, checksumPath, sha256, manifest };
}

async function writeZip(
  zipPath: string,
  payload: {
    manifest: ReviewManifest;
    manifestText?: string;
    tree: string;
    gitStatus: string;
    gitDiff: string;
    gitLog: string;
    readme: string;
    includedFiles: string[];
    projectTexts: Map<string, string>;
    evidenceTexts: Map<string, string>;
    uadsVersion: string;
  },
): Promise<void> {
  fs.mkdirSync(path.dirname(zipPath), { recursive: true });

  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  const done = new Promise<void>((resolve, reject) => {
    output.on("close", () => resolve());
    output.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(output);

  const manifestText = payload.manifestText ?? `${JSON.stringify(payload.manifest, null, 2)}\n`;
  archive.append(manifestText, { name: "review-manifest.json" });
  archive.append(payload.tree, { name: "repository-tree.txt" });
  archive.append(`${payload.gitStatus}\n`, { name: "git-status.txt" });
  archive.append(`${payload.gitDiff}\n`, { name: "git-diff.txt" });
  archive.append(`${payload.gitLog}\n`, { name: "git-log.txt" });
  archive.append(`${payload.uadsVersion}\n`, { name: "version.txt" });
  archive.append(payload.readme, { name: "README.txt" });

  for (const [name, content] of payload.evidenceTexts) {
    archive.append(content, { name: `evidence/${name}` });
  }

  for (const rel of payload.includedFiles) {
    const content = payload.projectTexts.get(rel);
    if (content === undefined) {
      continue;
    }
    archive.append(content, { name: `project/${rel}` });
  }

  await archive.finalize();
  await done;
}
