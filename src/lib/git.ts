import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { sanitizeRemoteUrl } from "./sanitize-url.js";

export type GitSummary = {
  available: boolean;
  repoRoot: string | null;
  branch: string | null;
  head: string | null;
  originUrl: string | null;
  status: string;
  diff: string;
  log: string;
};

function runGit(args: string[], cwd: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function findGitRoot(startDir: string): string | null {
  let current = path.resolve(startDir);

  while (true) {
    const gitPath = path.join(current, ".git");
    if (fs.existsSync(gitPath)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

export function gitAvailable(): boolean {
  try {
    execFileSync("git", ["--version"], { stdio: ["ignore", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

export function readGitSummary(cwd: string): GitSummary {
  const available = gitAvailable();
  const repoRoot = findGitRoot(cwd);

  if (!available || !repoRoot) {
    return {
      available,
      repoRoot,
      branch: null,
      head: null,
      originUrl: null,
      status: available ? "Not a git repository." : "git is not available on PATH.",
      diff: "",
      log: "",
    };
  }

  const safe = (args: string[]): string => {
    try {
      return runGit(args, repoRoot);
    } catch {
      return "";
    }
  };

  return {
    available,
    repoRoot,
    branch: safe(["rev-parse", "--abbrev-ref", "HEAD"]) || null,
    head: safe(["rev-parse", "HEAD"]) || null,
    originUrl: sanitizeRemoteUrl(safe(["remote", "get-url", "origin"]) || null),
    status: safe(["status", "--porcelain=v1", "-uall"]) || "(clean)",
    diff: safe(["diff", "HEAD"]),
    log: safe(["log", "-20", "--oneline"]) || "(no commits yet)",
  };
}
