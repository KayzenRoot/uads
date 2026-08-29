import fs from "node:fs";
import path from "node:path";
import { EXCLUDED_DIRECTORY_NAMES } from "../lib/constants.js";
import { isBinaryFileName, isExcludedDirectoryName } from "../lib/exclusions.js";
import { runProcess } from "../lib/exec.js";
import { isPathInside, sha256Hex, toPosix } from "../lib/hash.js";
import { assertSafeRelativeProjectPath } from "./safe-path.js";

export type PorcelainEntry = {
  code: string;
  path: string;
};

function runGit(args: string[], cwd: string, trim = true): string {
  const result = runProcess("git", args, { cwd });
  if (result.error || (result.status ?? 1) !== 0) {
    throw result.error ?? new Error((result.stderr || "git failed").trim());
  }
  const stdout = result.stdout ?? "";
  return trim ? stdout.trim() : stdout;
}

export function gitPorcelain(repoRoot: string): string {
  return runGit(["status", "--porcelain=v1", "-uall"], repoRoot, false).replace(/(?:\r?\n)+$/, "");
}

export function isWorktreeDirty(repoRoot: string): boolean {
  return gitPorcelain(repoRoot).length > 0;
}

export function gitDiffHead(repoRoot: string): string {
  return runGit(["diff", "HEAD"], repoRoot, false);
}

export function parseGitPorcelain(output: string): PorcelainEntry[] {
  const entries: PorcelainEntry[] = [];
  for (const raw of output.split(/\r?\n/)) {
    if (!raw.trimEnd()) {
      continue;
    }
    if (raw.length < 4) {
      continue;
    }
    const code = raw.slice(0, 2);
    let rest = raw.slice(3);
    const renameAt = rest.lastIndexOf(" -> ");
    if (renameAt >= 0) {
      rest = rest.slice(renameAt + 4);
    }
    if (rest.startsWith("\"") && rest.endsWith("\"")) {
      rest = rest.slice(1, -1);
    }
    const relative = toPosix(rest).replace(/\\/g, "/");
    entries.push({ code, path: relative });
  }
  return entries;
}

export function pathHasExcludedSegment(relativePath: string): boolean {
  return toPosix(relativePath)
    .split("/")
    .filter(Boolean)
    .some((part) => isExcludedDirectoryName(part) || EXCLUDED_DIRECTORY_NAMES.has(part));
}

export function listChangedRelativePaths(repoRoot: string): string[] {
  const entries = parseGitPorcelain(gitPorcelain(repoRoot));
  const paths = new Set<string>();
  for (const entry of entries) {
    if (pathHasExcludedSegment(entry.path)) {
      continue;
    }
    try {
      paths.add(assertSafeRelativeProjectPath(entry.path));
    } catch {
      continue;
    }
  }
  return [...paths].sort((a, b) => a.localeCompare(b));
}

export function hashUntrackedFile(repoRoot: string, relativePath: string): string {
  const abs = path.resolve(repoRoot, relativePath);
  if (!isPathInside(repoRoot, abs)) {
    throw new Error("path traversal rejected");
  }
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return "missing";
  }
  return sha256Hex(fs.readFileSync(abs));
}

export function computeChangeDigest(repoRoot: string, relativePaths: string[]): string {
  const diff = gitDiffHead(repoRoot);
  const lines = [`diff:${sha256Hex(diff)}`];
  for (const relative of [...relativePaths].sort((a, b) => a.localeCompare(b))) {
    const abs = path.resolve(repoRoot, relative);
    const exists = fs.existsSync(abs) && fs.statSync(abs).isFile();
    if (!exists) {
      lines.push(`${relative}:deleted`);
      continue;
    }
    if (isBinaryFileName(relative)) {
      lines.push(`${relative}:binary:${fs.statSync(abs).size}`);
      continue;
    }
    lines.push(`${relative}:${sha256Hex(fs.readFileSync(abs))}`);
  }
  return sha256Hex(lines.join("\n"));
}
