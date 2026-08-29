import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { atomicWriteFile } from "../lib/atomic-write.js";
import { findPackageRoot } from "../lib/version.js";
import { ensureGlobalLayout, resolveUadsHome } from "../lib/workspace.js";

export const UADS_AGENT_PREFIX = "uads-";
export const MANIFEST_NAME = "uads-managed-agents.json";

const AGENT_FILES = [
  "uads-repo-inspector.md",
  "uads-implementation-agent.md",
  "uads-independent-reviewer.md",
  "uads-security-reviewer.md",
  "uads-performance-reviewer.md",
  "uads-checkpoint-manager.md",
];

export function resolveCursorAgentsDir(cursorUserHome?: string): string {
  const home = cursorUserHome ?? process.env.CURSOR_USER_HOME ?? os.homedir();
  return path.join(home, ".cursor", "agents");
}

export function installCursorAgents(input: {
  uadsHome?: string;
  cursorUserHome?: string;
  packageRoot?: string;
}): { installed: string[]; skipped: string[]; cursorDir: string; error?: string } {
  const packageRoot = input.packageRoot ?? findPackageRoot();
  const uadsHome = ensureGlobalLayout(input.uadsHome ?? resolveUadsHome());
  const canonicalDir = path.join(uadsHome, "agents");
  fs.mkdirSync(canonicalDir, { recursive: true });

  const installed: string[] = [];
  for (const file of AGENT_FILES) {
    const source = path.join(packageRoot, "agents", file);
    if (!fs.existsSync(source)) {
      continue;
    }
    const dest = path.join(canonicalDir, file);
    fs.copyFileSync(source, dest);
    installed.push(dest);
  }

  const cursorDir = resolveCursorAgentsDir(input.cursorUserHome);
  try {
    fs.mkdirSync(cursorDir, { recursive: true });
    const probe = path.join(cursorDir, `.uads-write-probe-${process.pid}`);
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
  } catch (error) {
    return {
      installed,
      skipped: AGENT_FILES,
      cursorDir,
      error: `Cursor adapter skipped: cannot write ${cursorDir} (${error instanceof Error ? error.message : String(error)})`,
    };
  }

  const manifestPath = path.join(cursorDir, MANIFEST_NAME);
  const copied: string[] = [];
  const skipped: string[] = [];
  for (const file of AGENT_FILES) {
    const source = path.join(canonicalDir, file);
    if (!fs.existsSync(source)) {
      skipped.push(file);
      continue;
    }
    if (!file.startsWith(UADS_AGENT_PREFIX)) {
      skipped.push(file);
      continue;
    }
    const dest = path.join(cursorDir, file);
    fs.copyFileSync(source, dest);
    copied.push(file);
  }
  atomicWriteFile(
    manifestPath,
    `${JSON.stringify({ owner: "UADS", prefix: UADS_AGENT_PREFIX, files: copied, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
  return { installed: copied, skipped, cursorDir };
}
