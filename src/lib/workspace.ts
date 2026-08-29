import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { UADS_DIR_NAME } from "./constants.js";

export type UadsPaths = {
  home: string;
  core: string;
  skills: string;
  agents: string;
  adapters: string;
  cache: string;
  workspaces: string;
  workspace: string;
  reviews: string;
  evidence: string;
  state: string;
  checkpoints: string;
  workOrders: string;
  decisions: string;
  index: string;
  context: string;
  executionRuns: string;
  profile: string;
  currentState: string;
  repositoryMap: string;
  repositoryMapMeta: string;
};

export function resolveUadsHome(override?: string): string {
  if (override) {
    return path.resolve(override);
  }
  if (process.env.UADS_HOME) {
    return path.resolve(process.env.UADS_HOME);
  }
  return path.join(os.homedir(), UADS_DIR_NAME);
}

export function getUadsPaths(projectId: string, uadsHome?: string): UadsPaths {
  const home = resolveUadsHome(uadsHome);
  const workspace = path.join(home, "workspaces", projectId);

  return {
    home,
    core: path.join(home, "core"),
    skills: path.join(home, "skills"),
    agents: path.join(home, "agents"),
    adapters: path.join(home, "adapters"),
    cache: path.join(home, "cache"),
    workspaces: path.join(home, "workspaces"),
    workspace,
    reviews: path.join(workspace, "reviews"),
    evidence: path.join(workspace, "evidence"),
    state: path.join(workspace, "state"),
    checkpoints: path.join(workspace, "state", "checkpoints"),
    workOrders: path.join(workspace, "work-orders"),
    decisions: path.join(workspace, "decisions"),
    index: path.join(workspace, "index"),
    context: path.join(workspace, "context"),
    executionRuns: path.join(workspace, "execution-runs"),
    profile: path.join(workspace, "profile.json"),
    currentState: path.join(workspace, "state", "current.json"),
    repositoryMap: path.join(workspace, "index", "repository-map.json"),
    repositoryMapMeta: path.join(workspace, "index", "repository-map.meta.json"),
  };
}

export function ensureGlobalLayout(uadsHome?: string): string {
  const home = resolveUadsHome(uadsHome);
  for (const dir of ["core", "skills", "agents", "adapters", "cache", "workspaces"]) {
    fs.mkdirSync(path.join(home, dir), { recursive: true });
  }
  return home;
}

export function ensureWorkspace(projectId: string, uadsHome?: string): UadsPaths {
  if (!projectId) {
    throw new Error("projectId is required to create a sidecar workspace.");
  }

  const paths = getUadsPaths(projectId, uadsHome);
  ensureGlobalLayout(uadsHome);
  for (const dir of [
    paths.reviews,
    paths.evidence,
    paths.state,
    paths.checkpoints,
    paths.workOrders,
    paths.decisions,
    paths.index,
    paths.context,
    paths.executionRuns,
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return paths;
}

export type ProjectProfile = {
  schema: "uads.project-profile";
  schemaVersion: "0.1.0";
  projectId: string;
  fingerprint: string;
  fingerprintSource: "remote" | "path";
  repoRoot: string;
  createdAt: string;
  updatedAt: string;
};

export function readOrCreateProfile(
  paths: UadsPaths,
  profile: Omit<ProjectProfile, "createdAt" | "updatedAt" | "schema" | "schemaVersion">,
): ProjectProfile {
  const now = new Date().toISOString();

  if (fs.existsSync(paths.profile)) {
    const existing = JSON.parse(fs.readFileSync(paths.profile, "utf8")) as ProjectProfile;
    const updated: ProjectProfile = {
      ...existing,
      ...profile,
      schema: "uads.project-profile",
      schemaVersion: "0.1.0",
      updatedAt: now,
    };
    fs.writeFileSync(paths.profile, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
    return updated;
  }

  const created: ProjectProfile = {
    schema: "uads.project-profile",
    schemaVersion: "0.1.0",
    ...profile,
    createdAt: now,
    updatedAt: now,
  };
  fs.writeFileSync(paths.profile, `${JSON.stringify(created, null, 2)}\n`, "utf8");
  return created;
}
