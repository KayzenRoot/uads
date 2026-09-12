import { sha256Hex } from "../lib/hash.js";

export const GEF_VERSION = "1.0.0" as const;

export type GefFingerprintSource = "remote" | "path";
export type GefAdoptionMode = "PROMPT_ONLY" | "SHADOW_PLANNED";
export type GefProjectClassification = "NEW_PROJECT" | "EXISTING_PROJECT" | "PARTIALLY_GOVERNED";
export type GefGapStatus = "IMPLEMENTED" | "STAGED";
export type GefPackageManager = "npm" | "pnpm" | "yarn" | "bun" | "unknown";

export type GefIdentity = {
  projectId: string;
  fingerprint: string;
  fingerprintSource: GefFingerprintSource;
  repositoryIdentity: string | null;
  canonicalProjectId: string;
  repositoryGeneration: string;
};

export type GefCommands = {
  build: string | null;
  test: string | null;
  typecheck: string | null;
  lint: string | null;
};

export type GefProjectProfile = {
  schema: "uads.gef.project-profile";
  schemaVersion: "0.1.0";
  projectId: string;
  fingerprint: string;
  fingerprintSource: GefFingerprintSource;
  repositoryIdentity: string | null;
  repositoryGeneration: string;
  projectName: string;
  defaultBranch: string;
  packageManager: GefPackageManager;
  commands: GefCommands;
  evalFamilies: string[];
  governancePaths: string[];
  evidencePaths: string[];
  hostedGateNames: string[];
  supportedExecutorAdapters: ["codex", "cursor", "generic-agent-skills"];
  gefVersion: typeof GEF_VERSION;
  adoptionMode: GefAdoptionMode;
  createdAt: string;
  updatedAt: string;
  profileDigest: string;
};

export type GefCurrent = {
  schema: "uads.gef.current";
  schemaVersion: "0.1.0";
  projectId: string;
  fingerprint: string;
  profileDigest: string;
  classification: GefProjectClassification;
  adoptionMode: GefAdoptionMode;
  observedBranch: string;
  observedHeadSha: string | null;
  observedTreeSha: string | null;
  observedAt: string;
  currentDigest: string;
};

export type GefGapComponent = {
  id: string;
  name: string;
  wave: "W0" | "W1" | "W2" | "W3" | "W4" | "W5" | "W6" | "W7" | "W8";
  status: GefGapStatus;
  notes: string;
};

export type GefAdoptionGap = {
  schema: "uads.gef.adoption-gap";
  schemaVersion: "0.1.0";
  projectId: string;
  fingerprint: string;
  generatedAt: string;
  components: GefGapComponent[];
  authoritativeSkippingEnabled: false;
  gapDigest: string;
};

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalJson(nested)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function withoutDigest<T extends Record<string, unknown>>(value: T, field: keyof T): Omit<T, keyof Pick<T, typeof field>> {
  const copy = { ...value };
  delete copy[field];
  return copy as Omit<T, keyof Pick<T, typeof field>>;
}

export function digestRecord<T extends Record<string, unknown>>(value: T, field: keyof T): string {
  return sha256Hex(canonicalJson(withoutDigest(value, field)));
}

export const GEF_COMPONENTS: readonly GefGapComponent[] = [
  { id: "GEF-01", name: "Global Project Registry", wave: "W0", status: "IMPLEMENTED", notes: "W0 registry, profile, current manifest, classification and adoption gap are implemented." },
  { id: "GEF-02", name: "Source Drift Sentinel", wave: "W1", status: "STAGED", notes: "Planned for W1; W0 reports current source identity but does not authorize execution." },
  { id: "GEF-03", name: "UPIR Compiler", wave: "W1", status: "STAGED", notes: "Planned for W1." },
  { id: "GEF-04", name: "Context Compiler", wave: "W1", status: "STAGED", notes: "Planned for W1; existing context intelligence remains authoritative." },
  { id: "GEF-05", name: "Decision Capsule", wave: "W1", status: "STAGED", notes: "Planned for W1." },
  { id: "GEF-06", name: "Patch Recipe Compiler", wave: "W1", status: "STAGED", notes: "Planned for W1." },
  { id: "GEF-07", name: "Budget Governor", wave: "W1", status: "STAGED", notes: "Planned for W1; existing cost governor remains authoritative." },
  { id: "GEF-08", name: "Executor Prompt Compiler", wave: "W1", status: "STAGED", notes: "Planned for W1." },
  { id: "GEF-09", name: "Deterministic Work Plane", wave: "W2", status: "STAGED", notes: "Planned for W2; existing deterministic validators remain authoritative." },
  { id: "GEF-10", name: "Test Impact Router", wave: "W3", status: "STAGED", notes: "Planned for W3." },
  { id: "GEF-11", name: "Machine Evidence Engine", wave: "W2", status: "STAGED", notes: "Planned for W2; existing evidence contracts remain authoritative." },
  { id: "GEF-12", name: "Proof Dependency Graph", wave: "W3", status: "STAGED", notes: "Planned for W3." },
  { id: "GEF-13", name: "Review Merkle Ledger", wave: "W3", status: "STAGED", notes: "Planned for W3." },
  { id: "GEF-14", name: "HEDS Delta Packager", wave: "W3", status: "STAGED", notes: "Planned for W3; W0 never self-approves review." },
  { id: "GEF-15", name: "Gate Receipt Collector", wave: "W4", status: "STAGED", notes: "Planned for W4; hosted receipts remain outside the candidate head." },
  { id: "GEF-16", name: "Command Receipt Cache", wave: "W5", status: "STAGED", notes: "Planned for W5; existing evidence cache remains authoritative." },
  { id: "GEF-17", name: "Failure Fingerprint Cache", wave: "W5", status: "STAGED", notes: "Planned for W5; existing Failure Memory remains authoritative." },
  { id: "GEF-18", name: "Negative Capability Cache", wave: "W5", status: "STAGED", notes: "Planned for W5." },
  { id: "GEF-19", name: "Architecture Question Cache", wave: "W5", status: "STAGED", notes: "Planned for W5." },
  { id: "GEF-20", name: "Engineering Playbook Registry", wave: "W5", status: "STAGED", notes: "Planned for W5." },
  { id: "GEF-21", name: "Warm-Start Capsule", wave: "W5", status: "STAGED", notes: "Planned for W5; current checkpoint/resume remains authoritative." },
  { id: "GEF-22", name: "Telemetry Engine", wave: "W6", status: "STAGED", notes: "Planned for W6; W0 writes no prompt/source bodies or secrets." },
  { id: "GEF-23", name: "Prompt Auto-Tuner", wave: "W6", status: "STAGED", notes: "Planned for W6 and observational first." },
  { id: "GEF-24", name: "Shadow Assurance Engine", wave: "W7", status: "STAGED", notes: "Planned for W7; no authoritative skipping is enabled." },
  { id: "GEF-25", name: "Zero-Wait Orchestrator", wave: "W4", status: "STAGED", notes: "Planned for W4." },
  { id: "GEF-26", name: "CI Impact/Shard Planner", wave: "W4", status: "STAGED", notes: "Planned for W4; existing required checks are not weakened." },
  { id: "GEF-27", name: "Adoption/Bootstrap Engine", wave: "W7", status: "STAGED", notes: "W0 provides the bounded bootstrap/profile surface; deeper migration automation is staged for W7." },
] as const;
