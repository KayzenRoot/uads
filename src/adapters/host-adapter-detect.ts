import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { computeRuntimeIdentityDigest } from "../kernel/model-runtime.js";
import { MODEL_ROUTING_SCHEMA_VERSION, type RuntimeCapabilitySnapshot } from "../kernel/model-types.js";
import {
  builtinHostAdapterRegistry,
  getHostAdapterDefinition,
} from "./host-adapter-registry.js";
import type {
  HostAdapterDefinition,
  HostAdapterDetection,
  HostAdapterDetectionInput,
  HostAdapterId,
  HostAdapterRegistry,
} from "./host-adapter-types.js";
import { HOST_ADAPTER_CONTRACT_VERSION } from "./host-adapter-types.js";

export type ResolvedHostTarget = {
  definition: HostAdapterDefinition;
  hostHome: string;
  targetRoot: string;
  resourceRoot: string;
  manifestPath: string;
  explicitHome: boolean;
};

function envHome(definition: HostAdapterDefinition): string | undefined {
  if (definition.adapterId === "cursor") {
    return process.env.UADS_CURSOR_HOME ?? process.env.CURSOR_USER_HOME;
  }
  if (definition.adapterId === "codex") {
    return process.env.UADS_CODEX_HOME ?? process.env.CODEX_HOME;
  }
  return process.env.UADS_AGENT_SKILLS_HOME ?? process.env.AGENT_SKILLS_HOME;
}

function hasSymlinkSegment(target: string): boolean {
  const absolute = path.resolve(target);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  for (const segment of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) return true;
  }
  return false;
}

export function resolveHostTarget(
  definition: HostAdapterDefinition,
  input: HostAdapterDetectionInput = {},
): ResolvedHostTarget {
  const configuredHome = input.hostHome ?? envHome(definition);
  const hostHome = path.resolve(configuredHome ?? os.homedir());
  const targetRoot =
    definition.adapterId === "cursor" ? path.join(hostHome, ".cursor") : hostHome;
  const resourceRoot = path.join(targetRoot, definition.targetRelativeRoot);
  const manifestPath = path.join(targetRoot, definition.manifestRelativeTarget);
  return {
    definition,
    hostHome,
    targetRoot,
    resourceRoot,
    manifestPath,
    explicitHome: Boolean(configuredHome),
  };
}

function detectionStatus(target: ResolvedHostTarget): {
  status: HostAdapterDetection["status"];
  reasonCodes: string[];
} {
  if (hasSymlinkSegment(target.targetRoot)) {
    return { status: "BLOCKED", reasonCodes: ["HOST_TARGET_SYMLINK"] };
  }
  if (fs.existsSync(target.targetRoot) && !fs.statSync(target.targetRoot).isDirectory()) {
    return { status: "BLOCKED", reasonCodes: ["HOST_TARGET_NOT_DIRECTORY"] };
  }
  if (!fs.existsSync(target.targetRoot)) {
    return {
      status: target.explicitHome ? "UNPROVEN" : "UNAVAILABLE",
      reasonCodes: [target.explicitHome ? "EXPLICIT_TARGET_NOT_PRESENT" : "HOST_NOT_PRESENT"],
    };
  }
  if (fs.existsSync(target.resourceRoot)) {
    if (hasSymlinkSegment(target.resourceRoot) || !fs.statSync(target.resourceRoot).isDirectory()) {
      return { status: "BLOCKED", reasonCodes: ["HOST_RESOURCE_ROOT_INVALID"] };
    }
  }
  return { status: "SUPPORTED", reasonCodes: ["HOST_TARGET_PRESENT", "VERSION_UNPROVEN"] };
}

export function detectHostAdapter(
  adapterId: HostAdapterId,
  input: HostAdapterDetectionInput = {},
  registry = builtinHostAdapterRegistry(),
): HostAdapterDetection {
  const definition = getHostAdapterDefinition(adapterId, registry);
  const target = resolveHostTarget(definition, input);
  const detected = detectionStatus(target);
  return {
    adapterId,
    status: detected.status,
    version: null,
    detectionMethod: target.explicitHome
      ? "explicit-home-or-environment"
      : "known-user-home-structure",
    targetLabel: definition.targetLabel,
    provenCapabilities: { ...definition.capabilities },
    reasonCodes: detected.reasonCodes,
    detectedAt: new Date().toISOString(),
  };
}

export function detectAllHostAdapters(
  input: HostAdapterDetectionInput = {},
  registry = builtinHostAdapterRegistry(),
): HostAdapterDetection[] {
  return registry.adapters
    .slice()
    .sort((a, b) => a.adapterId.localeCompare(b.adapterId))
    .map((definition) => detectHostAdapter(definition.adapterId, input, registry));
}

export function runtimeSnapshotFromHostDetection(
  detection: HostAdapterDetection,
): RuntimeCapabilitySnapshot {
  const base: Omit<RuntimeCapabilitySnapshot, "identityDigest"> = {
    schema: "uads.runtime-capability-snapshot",
    schemaVersion: MODEL_ROUTING_SCHEMA_VERSION,
    runtimeId: `host-${detection.adapterId}`,
    adapterId: detection.adapterId,
    adapterVersion: HOST_ADAPTER_CONTRACT_VERSION,
    runtimeVersion: detection.version,
    capabilities: { ...detection.provenCapabilities },
    provenance: {
      source: "adapter",
      confidence: detection.status === "SUPPORTED" ? "proven" : "unknown",
    },
  };
  return { ...base, identityDigest: computeRuntimeIdentityDigest(base) };
}
