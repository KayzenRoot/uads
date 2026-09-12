import fs from "node:fs";
import path from "node:path";
import { computeProjectFingerprint } from "../lib/fingerprint.js";
import { runProcess } from "../lib/exec.js";
import { findGitRoot, readGitSummary } from "../lib/git.js";
import { sha256Hex } from "../lib/hash.js";
import { readUadsVersion } from "../lib/version.js";
import {
  canonicalJson,
  type GefCommands,
  type GefFingerprintSource,
  type GefIdentity,
  type GefPackageManager,
  type GefProjectProfile,
} from "./contracts.js";

export type GefSourceSnapshot = {
  repoRoot: string;
  identity: GefIdentity;
  profile: Omit<GefProjectProfile, "createdAt" | "updatedAt" | "profileDigest" | "adoptionMode">;
  branch: string;
  headSha: string | null;
  treeSha: string | null;
  workingTree: "clean" | "dirty" | "UNKNOWN";
};

function runGit(cwd: string, args: string[]): string | null {
  const result = runProcess("git", args, { cwd });
  if (result.error || (result.status ?? 1) !== 0) {
    return null;
  }
  const output = (result.stdout ?? "").trim();
  return output || null;
}

function repositoryGeneration(repoRoot: string): string {
  const roots = runGit(repoRoot, ["rev-list", "--max-parents=0", "--all"])
    ?.split(/\r?\n/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .sort();
  return roots && roots.length > 0 ? roots.join(",") : "NO_COMMIT_YET";
}

function defaultBranch(repoRoot: string, branch: string | null): string {
  const remoteHead = runGit(repoRoot, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]);
  if (remoteHead?.startsWith("origin/")) {
    return remoteHead.slice("origin/".length);
  }
  return branch || "main";
}

function packageManager(repoRoot: string): GefPackageManager {
  if (fs.existsSync(path.join(repoRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(repoRoot, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(repoRoot, "bun.lockb")) || fs.existsSync(path.join(repoRoot, "bun.lock"))) return "bun";
  if (fs.existsSync(path.join(repoRoot, "package-lock.json"))) return "npm";
  return "unknown";
}

function packageRunner(manager: GefPackageManager): string | null {
  if (manager === "unknown") return null;
  return manager;
}

function packageMetadata(repoRoot: string, manager: GefPackageManager): {
  projectName: string;
  commands: GefCommands;
  evalFamilies: string[];
} {
  const packagePath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(packagePath)) {
    return {
      projectName: path.basename(repoRoot),
      commands: { build: null, test: null, typecheck: null, lint: null },
      evalFamilies: [],
    };
  }
  let packageJson: { name?: unknown; scripts?: Record<string, unknown> };
  try {
    packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { name?: unknown; scripts?: Record<string, unknown> };
  } catch {
    throw new Error("GEF_SOURCE_CONFLICT: invalid package.json");
  }

  const scripts = packageJson.scripts ?? {};
  const runner = packageRunner(manager);
  const command = (name: string): string | null =>
    runner && typeof scripts[name] === "string" ? `${runner} run ${name}` : null;
  const evalFamilies = Object.keys(scripts)
    .filter((key) => key.startsWith("eval:"))
    .map((key) => key.slice("eval:".length))
    .filter(Boolean)
    .sort();
  return {
    projectName: typeof packageJson.name === "string" && packageJson.name.trim() ? packageJson.name.trim() : path.basename(repoRoot),
    commands: { build: command("build"), test: command("test"), typecheck: command("typecheck"), lint: command("lint") },
    evalFamilies,
  };
}

function listExistingPaths(repoRoot: string, candidates: string[]): string[] {
  return candidates.filter((relative) => fs.existsSync(path.join(repoRoot, relative)));
}

function hostedGateNames(repoRoot: string): string[] {
  const workflows = path.join(repoRoot, ".github", "workflows");
  if (!fs.existsSync(workflows)) return [];
  return fs.readdirSync(workflows)
    .filter((name) => /\.(yml|yaml)$/i.test(name))
    .map((name) => name.replace(/\.(yml|yaml)$/i, ""))
    .sort();
}

function safeRepositoryIdentity(value: string | null): string | null {
  if (!value) return null;
  return value.length <= 500 ? value : value.slice(0, 500);
}

export function readGefSourceSnapshot(cwd: string): GefSourceSnapshot {
  const git = readGitSummary(cwd);
  const repoRoot = git.repoRoot ?? findGitRoot(cwd);
  if (!repoRoot) {
    throw new Error("GEF_UNAVAILABLE: current path is not a git repository");
  }
  const baseFingerprint = computeProjectFingerprint({ originUrl: git.originUrl, repoRoot });
  const generation = repositoryGeneration(repoRoot);
  const repositoryIdentity = safeRepositoryIdentity(baseFingerprint.source === "remote" ? baseFingerprint.material : null);
  const material = canonicalJson({
    repositoryIdentity,
    canonicalProjectId: baseFingerprint.projectId,
    repositoryGeneration: generation,
  });
  const identity: GefIdentity = {
    projectId: baseFingerprint.projectId,
    fingerprint: sha256Hex(material),
    fingerprintSource: baseFingerprint.source as GefFingerprintSource,
    repositoryIdentity,
    canonicalProjectId: baseFingerprint.projectId,
    repositoryGeneration: generation,
  };
  const manager = packageManager(repoRoot);
  const metadata = packageMetadata(repoRoot, manager);
  const branch = git.branch ?? defaultBranch(repoRoot, git.branch);
  const treeSha = runGit(repoRoot, ["show", "-s", "--format=%T", "HEAD"]);
  const headSha = git.head;
  const governancePaths = listExistingPaths(repoRoot, ["GOVERNANCE.md", "CONTRIBUTING.md", ".engineering", ".github"]);
  const evidencePaths = listExistingPaths(repoRoot, [".engineering/reports", ".engineering/checkpoints", "schemas", "docs"]);
  const profile: Omit<GefProjectProfile, "createdAt" | "updatedAt" | "profileDigest" | "adoptionMode"> = {
    schema: "uads.gef.project-profile",
    schemaVersion: "0.1.0",
    projectId: identity.projectId,
    fingerprint: identity.fingerprint,
    fingerprintSource: identity.fingerprintSource,
    repositoryIdentity: identity.repositoryIdentity,
    repositoryGeneration: identity.repositoryGeneration,
    projectName: metadata.projectName,
    defaultBranch: defaultBranch(repoRoot, git.branch),
    packageManager: manager,
    commands: metadata.commands,
    evalFamilies: metadata.evalFamilies,
    governancePaths,
    evidencePaths,
    hostedGateNames: hostedGateNames(repoRoot),
    supportedExecutorAdapters: ["codex", "cursor", "generic-agent-skills"],
    gefVersion: "1.0.0",
  };
  return {
    repoRoot,
    identity,
    profile,
    branch,
    headSha,
    treeSha,
    workingTree: git.status === "(clean)" ? "clean" : git.available ? "dirty" : "UNKNOWN",
  };
}

export function repositoryHasGovernance(repoRoot: string): boolean {
  return ["GOVERNANCE.md", "CONTRIBUTING.md", ".engineering", ".github"].some((relative) => fs.existsSync(path.join(repoRoot, relative)));
}
