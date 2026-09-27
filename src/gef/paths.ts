import fs from "node:fs";
import path from "node:path";
import { assertSafeSidecarId } from "../lib/atomic-write.js";
import { resolveUadsHome } from "../lib/workspace.js";

export type GefRootPaths = {
  home: string;
  root: string;
  registry: string;
  registryProjects: string;
  projects: string;
  contextCas: string;
  symbolIndex: string;
  dependencyGraph: string;
  proofLedger: string;
  evidence: string;
  promptIr: string;
  promptCache: string;
  patchRecipes: string;
  commandReceipts: string;
  gateReceipts: string;
  failureFingerprints: string;
  negativeCapabilities: string;
  architectureFacts: string;
  playbooks: string;
  executorProfiles: string;
  telemetry: string;
  experiments: string;
};

export type GefProjectPaths = GefRootPaths & {
  projectId: string;
  project: string;
  profile: string;
  current: string;
  adoptionGap: string;
};

const GEF_DIRECTORIES = [
  "registry",
  path.join("registry", "projects"),
  "projects",
  "context-cas",
  "symbol-index",
  "dependency-graph",
  "proof-ledger",
  "evidence",
  "prompt-ir",
  "prompt-cache",
  "patch-recipes",
  "command-receipts",
  "gate-receipts",
  "failure-fingerprints",
  "negative-capabilities",
  "architecture-facts",
  "playbooks",
  "executor-profiles",
  "telemetry",
  "experiments",
] as const;

export function getGefRootPaths(uadsHome?: string): GefRootPaths {
  const home = resolveUadsHome(uadsHome);
  const root = path.join(home, "gef");
  const directory = (name: string): string => path.join(root, name);
  return {
    home,
    root,
    registry: directory("registry"),
    registryProjects: directory(path.join("registry", "projects")),
    projects: directory("projects"),
    contextCas: directory("context-cas"),
    symbolIndex: directory("symbol-index"),
    dependencyGraph: directory("dependency-graph"),
    proofLedger: directory("proof-ledger"),
    evidence: directory("evidence"),
    promptIr: directory("prompt-ir"),
    promptCache: directory("prompt-cache"),
    patchRecipes: directory("patch-recipes"),
    commandReceipts: directory("command-receipts"),
    gateReceipts: directory("gate-receipts"),
    failureFingerprints: directory("failure-fingerprints"),
    negativeCapabilities: directory("negative-capabilities"),
    architectureFacts: directory("architecture-facts"),
    playbooks: directory("playbooks"),
    executorProfiles: directory("executor-profiles"),
    telemetry: directory("telemetry"),
    experiments: directory("experiments"),
  };
}

export function getGefProjectPaths(projectId: string, uadsHome?: string): GefProjectPaths {
  assertSafeSidecarId(projectId);
  const root = getGefRootPaths(uadsHome);
  const project = path.join(root.projects, projectId);
  return {
    ...root,
    projectId,
    project,
    profile: path.join(root.registryProjects, `${projectId}.json`),
    current: path.join(project, "current.json"),
    adoptionGap: path.join(project, "adoption-gap.json"),
  };
}

export function ensureGefLayout(paths: GefProjectPaths): GefProjectPaths {
  for (const directory of GEF_DIRECTORIES) {
    fs.mkdirSync(path.join(paths.root, directory), { recursive: true });
  }
  fs.mkdirSync(paths.project, { recursive: true });
  return paths;
}
