import fs from "node:fs";
import path from "node:path";
import { atomicWriteJson, readJsonIfValid } from "../lib/atomic-write.js";
import { validateAgainstSchema } from "../lib/json-schema.js";
import { getUadsPaths } from "../lib/workspace.js";
import {
  canonicalJson,
  digestRecord,
  GEF_COMPONENTS,
  GEF_VERSION,
  type GefAdoptionGap,
  type GefAdoptionMode,
  type GefCurrent,
  type GefProjectClassification,
  type GefProjectProfile,
} from "./contracts.js";
import { ensureGefLayout, getGefProjectPaths } from "./paths.js";
import { readGefSourceSnapshot, repositoryHasGovernance } from "./source.js";

export type GefSourceStatus = "UNREGISTERED" | "MATCH" | "HEAD_MOVED" | "IDENTITY_DRIFT" | "CORRUPT";

export type GefStatus = {
  schema: "uads.gef.status";
  schemaVersion: "0.1.0";
  projectId: string;
  classification: GefProjectClassification;
  registered: boolean;
  sourceStatus: GefSourceStatus;
  adoptionMode: GefAdoptionMode | null;
  branch: string;
  headSha: string | null;
  treeSha: string | null;
  workingTree: "clean" | "dirty" | "UNKNOWN";
  hostedGateNames: string[];
  stagedComponentCount: number;
  implementedComponentCount: number;
};

export type GefAdoptionResult = {
  profile: GefProjectProfile;
  current: GefCurrent;
  adoptionGap: GefAdoptionGap;
  classification: GefProjectClassification;
  created: boolean;
};

function assertRecord(schemaFile: string, value: unknown): void {
  const errors = validateAgainstSchema(schemaFile, value);
  if (errors.length > 0) {
    throw new Error(`GEF registry rejected ${schemaFile}: ${errors.join("; ")}`);
  }
}

function readRecord<T>(file: string, schemaFile: string): T | null {
  const result = readJsonIfValid<T>(file);
  if (!result.ok) {
    if (result.error === "missing") return null;
    throw new Error(`GEF registry corrupt: ${path.basename(file)}`);
  }
  assertRecord(schemaFile, result.value);
  if (schemaFile === "gef-project-profile.schema.json" && (result.value as { profileDigest?: string }).profileDigest !== digestRecord(result.value as Record<string, unknown>, "profileDigest")) {
    throw new Error(`GEF registry digest mismatch: ${path.basename(file)}`);
  }
  if (schemaFile === "gef-current.schema.json" && (result.value as { currentDigest?: string }).currentDigest !== digestRecord(result.value as Record<string, unknown>, "currentDigest")) {
    throw new Error(`GEF registry digest mismatch: ${path.basename(file)}`);
  }
  if (schemaFile === "gef-adoption-gap.schema.json" && (result.value as { gapDigest?: string }).gapDigest !== digestRecord(result.value as Record<string, unknown>, "gapDigest")) {
    throw new Error(`GEF registry digest mismatch: ${path.basename(file)}`);
  }
  return result.value;
}

function readExistingUadsProfile(repoRoot: string, uadsHome?: string): boolean {
  const source = readGefSourceSnapshot(repoRoot);
  return fs.existsSync(getUadsPaths(source.identity.projectId, uadsHome).profile);
}

function classifyProject(repoRoot: string, projectPaths: ReturnType<typeof getGefProjectPaths>, uadsHome?: string): GefProjectClassification {
  if (fs.existsSync(projectPaths.profile)) return "EXISTING_PROJECT";
  if (repositoryHasGovernance(repoRoot) || readExistingUadsProfile(repoRoot, uadsHome)) return "PARTIALLY_GOVERNED";
  return "NEW_PROJECT";
}

function profileWithDigest(
  base: Omit<GefProjectProfile, "createdAt" | "updatedAt" | "profileDigest" | "adoptionMode">,
  adoptionMode: GefAdoptionMode,
  createdAt: string,
  updatedAt: string,
): GefProjectProfile {
  const withoutDigest = { ...base, adoptionMode, createdAt, updatedAt };
  const profile = { ...withoutDigest, profileDigest: "" } as GefProjectProfile;
  return { ...profile, profileDigest: digestRecord(profile, "profileDigest") };
}

function currentWithDigest(input: Omit<GefCurrent, "currentDigest">): GefCurrent {
  const current = { ...input, currentDigest: "" } as GefCurrent;
  return { ...current, currentDigest: digestRecord(current, "currentDigest") };
}

function gapWithDigest(input: Omit<GefAdoptionGap, "gapDigest">): GefAdoptionGap {
  const gap = { ...input, gapDigest: "" } as GefAdoptionGap;
  return { ...gap, gapDigest: digestRecord(gap, "gapDigest") };
}

export function readGefProfile(projectId: string, uadsHome?: string): GefProjectProfile | null {
  const paths = getGefProjectPaths(projectId, uadsHome);
  return readRecord<GefProjectProfile>(paths.profile, "gef-project-profile.schema.json");
}

export function readGefCurrent(projectId: string, uadsHome?: string): GefCurrent | null {
  const paths = getGefProjectPaths(projectId, uadsHome);
  return readRecord<GefCurrent>(paths.current, "gef-current.schema.json");
}

export function readGefAdoptionGap(projectId: string, uadsHome?: string): GefAdoptionGap | null {
  const paths = getGefProjectPaths(projectId, uadsHome);
  return readRecord<GefAdoptionGap>(paths.adoptionGap, "gef-adoption-gap.schema.json");
}

export function adoptGefProject(input: {
  cwd: string;
  uadsHome?: string;
  shadow?: boolean;
}): GefAdoptionResult {
  const source = readGefSourceSnapshot(input.cwd);
  const paths = getGefProjectPaths(source.identity.projectId, input.uadsHome);
  const hadProfile = fs.existsSync(paths.profile);
  const existing = hadProfile ? readGefProfile(source.identity.projectId, input.uadsHome) : null;
  const classification = classifyProject(source.repoRoot, paths, input.uadsHome);
  const now = new Date().toISOString();
  const adoptionMode: GefAdoptionMode = input.shadow ? "SHADOW_PLANNED" : "PROMPT_ONLY";
  const profile = profileWithDigest(
    source.profile,
    adoptionMode,
    existing?.createdAt ?? now,
    now,
  );
  const current = currentWithDigest({
    schema: "uads.gef.current",
    schemaVersion: "0.1.0",
    projectId: source.identity.projectId,
    fingerprint: source.identity.fingerprint,
    profileDigest: profile.profileDigest,
    classification,
    adoptionMode,
    observedBranch: source.branch,
    observedHeadSha: source.headSha,
    observedTreeSha: source.treeSha,
    observedAt: now,
  });
  const adoptionGap = gapWithDigest({
    schema: "uads.gef.adoption-gap",
    schemaVersion: "0.1.0",
    projectId: source.identity.projectId,
    fingerprint: source.identity.fingerprint,
    generatedAt: now,
    components: GEF_COMPONENTS.map((component) => ({ ...component })),
    authoritativeSkippingEnabled: false,
  });
  assertRecord("gef-project-profile.schema.json", profile);
  assertRecord("gef-current.schema.json", current);
  assertRecord("gef-adoption-gap.schema.json", adoptionGap);
  ensureGefLayout(paths);
  atomicWriteJson(paths.profile, profile);
  atomicWriteJson(paths.current, current);
  atomicWriteJson(paths.adoptionGap, adoptionGap);
  return { profile, current, adoptionGap, classification, created: !hadProfile };
}

export function readGefStatus(input: { cwd: string; uadsHome?: string }): GefStatus {
  const source = readGefSourceSnapshot(input.cwd);
  const paths = getGefProjectPaths(source.identity.projectId, input.uadsHome);
  const classification = classifyProject(source.repoRoot, paths, input.uadsHome);
  let profile: GefProjectProfile | null = null;
  let current: GefCurrent | null = null;
  let sourceStatus: GefSourceStatus = "UNREGISTERED";
  try {
    profile = readGefProfile(source.identity.projectId, input.uadsHome);
    current = readGefCurrent(source.identity.projectId, input.uadsHome);
    if (profile && current) {
      if (profile.fingerprint !== source.identity.fingerprint || current.fingerprint !== source.identity.fingerprint) {
        sourceStatus = "IDENTITY_DRIFT";
      } else if (current.observedHeadSha !== source.headSha || current.observedTreeSha !== source.treeSha) {
        sourceStatus = "HEAD_MOVED";
      } else {
        sourceStatus = "MATCH";
      }
    }
  } catch {
    sourceStatus = "CORRUPT";
  }
  return {
    schema: "uads.gef.status",
    schemaVersion: "0.1.0",
    projectId: source.identity.projectId,
    classification,
    registered: Boolean(profile && current),
    sourceStatus,
    adoptionMode: profile?.adoptionMode ?? null,
    branch: source.branch,
    headSha: source.headSha,
    treeSha: source.treeSha,
    workingTree: source.workingTree,
    hostedGateNames: source.profile.hostedGateNames,
    stagedComponentCount: GEF_COMPONENTS.filter((component) => component.status === "STAGED").length,
    implementedComponentCount: GEF_COMPONENTS.filter((component) => component.status === "IMPLEMENTED").length,
  };
}

export function readGefDoctor(input: { cwd: string; uadsHome?: string }): {
  schema: "uads.gef.doctor";
  schemaVersion: "0.1.0";
  checks: Array<{ name: string; status: "PASS" | "FAIL" | "UNKNOWN"; detail: string }>;
} {
  const source = readGefSourceSnapshot(input.cwd);
  const paths = getGefProjectPaths(source.identity.projectId, input.uadsHome);
  let profile: GefProjectProfile | null = null;
  let current: GefCurrent | null = null;
  let registryCorrupt = false;
  try {
    profile = readGefProfile(source.identity.projectId, input.uadsHome);
    current = readGefCurrent(source.identity.projectId, input.uadsHome);
  } catch {
    registryCorrupt = true;
  }
  const checks: Array<{ name: string; status: "PASS" | "FAIL" | "UNKNOWN"; detail: string }> = [
    { name: "repository", status: "PASS", detail: "git repository detected" },
    { name: "remote-identity", status: source.identity.repositoryIdentity ? "PASS" : "UNKNOWN", detail: source.identity.repositoryIdentity ? "remote identity available" : "no origin remote; path identity is non-relocatable" },
    { name: "gef-layout", status: fs.existsSync(paths.root) ? "PASS" : "UNKNOWN", detail: fs.existsSync(paths.root) ? "global GEF root exists" : "run uads gef adopt to initialize" },
    { name: "profile", status: registryCorrupt ? "FAIL" : profile ? "PASS" : "UNKNOWN", detail: registryCorrupt ? "registry record is corrupt or schema-invalid" : profile ? "profile is schema-valid" : "project is not registered" },
    { name: "current", status: registryCorrupt ? "FAIL" : current ? "PASS" : "UNKNOWN", detail: registryCorrupt ? "registry record could not be trusted" : current ? "current manifest is schema-valid" : "current manifest is not registered" },
    { name: "authoritative-skipping", status: "PASS", detail: "disabled until Shadow Assurance promotion" },
    { name: "project-local-footprint", status: fs.existsSync(path.join(source.repoRoot, ".uads")) ? "FAIL" : "PASS", detail: fs.existsSync(path.join(source.repoRoot, ".uads")) ? "project-local .uads directory exists" : "no project-local .uads directory detected" },
  ];
  return { schema: "uads.gef.doctor", schemaVersion: "0.1.0", checks };
}

export function summarizeGefStatus(status: GefStatus): string {
  return [
    `GEF status for ${status.projectId}`,
    `classification: ${status.classification}`,
    `registered: ${status.registered}`,
    `sourceStatus: ${status.sourceStatus}`,
    `adoptionMode: ${status.adoptionMode ?? "(none)"}`,
    `branch: ${status.branch}`,
    `head: ${status.headSha ?? "(none)"}`,
    `tree: ${status.treeSha ?? "(none)"}`,
    `workingTree: ${status.workingTree}`,
    `hostedGates: ${status.hostedGateNames.join(", ") || "(none)"}`,
    `components: ${status.implementedComponentCount} implemented, ${status.stagedComponentCount} staged`,
    "",
  ].join("\n");
}

export function summarizeGefDoctor(result: ReturnType<typeof readGefDoctor>): string {
  return [
    "GEF doctor",
    ...result.checks.map((check) => `${check.status === "PASS" ? "ok  " : check.status === "FAIL" ? "FAIL" : "?   "} ${check.name}: ${check.detail}`),
    "",
  ].join("\n");
}

export function profileDigestIsValid(profile: GefProjectProfile): boolean {
  return profile.profileDigest === digestRecord(profile, "profileDigest");
}

export function currentDigestIsValid(current: GefCurrent): boolean {
  return current.currentDigest === digestRecord(current, "currentDigest");
}

export function adoptionGapDigestIsValid(gap: GefAdoptionGap): boolean {
  return gap.gapDigest === digestRecord(gap, "gapDigest");
}

export function registryIdentityMaterial(profile: GefProjectProfile): string {
  return canonicalJson({
    projectId: profile.projectId,
    fingerprint: profile.fingerprint,
    repositoryIdentity: profile.repositoryIdentity,
    repositoryGeneration: profile.repositoryGeneration,
  });
}
