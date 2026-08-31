import fs from "node:fs";
import path from "node:path";
import { sha256Hex } from "../lib/hash.js";
import type { IndexBundle } from "./intelligence-types.js";
import { CACHE_POLICY_IDENTITY, MANIFEST_BASIS_PATHS, normalizeCommandIdentity } from "./cache-policy.js";
import { gateDef, type GateContractKind } from "./gates.js";
import type { RepositoryMap } from "./types.js";

export const GATE_REUSE_CONTRACT_VERSION = "0.6.0-c1";

const GATE_SCRIPT_KEYS: Record<string, string[]> = {
  static: ["lint", "typecheck"],
  "unit-test": ["test", "unit-test"],
  "contract-test": ["test", "contract-test"],
  build: ["build"],
  "web3-unit": ["test", "web3-test"],
  "dependency-audit": ["audit"],
  "database-migration": ["migrate"],
  "release-check": ["release"],
};

function detectPackageManager(repoRoot: string): string | null {
  if (fs.existsSync(path.join(repoRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(repoRoot, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(repoRoot, "bun.lock"))) return "bun";
  if (fs.existsSync(path.join(repoRoot, "package-lock.json"))) return "npm";
  if (fs.existsSync(path.join(repoRoot, "package.json"))) return "npm";
  return null;
}

export function packageScriptInvocation(pm: string | null, scriptKey: string): string {
  const runner = pm === "pnpm" ? "pnpm" : pm === "yarn" ? "yarn" : pm === "bun" ? "bun" : "npm";
  if (scriptKey === "test") {
    if (runner === "npm") return "npm test";
    if (runner === "pnpm") return "pnpm test";
    if (runner === "yarn") return "yarn test";
    if (runner === "bun") return "bun test";
  }
  return `${runner} run ${scriptKey}`;
}

export function deriveNormalizedCommandFromMap(gateId: string, map: RepositoryMap | null): string | null {
  if (!map) {
    return null;
  }
  const keys = GATE_SCRIPT_KEYS[gateId];
  if (!keys) {
    return null;
  }
  for (const key of keys) {
    const script = map.commands[key];
    if (script && String(script).trim()) {
      const invocation = packageScriptInvocation(map.packageManager, key);
      const scriptNorm = normalizeCommandIdentity(String(script));
      if (!scriptNorm) {
        return normalizeCommandIdentity(invocation);
      }
      return normalizeCommandIdentity(`${invocation} :: ${scriptNorm}`);
    }
  }
  return null;
}

export type GateReuseContract = {
  gateId: string;
  contractKind: GateContractKind;
  contractVersion: string;
  normalizedCommandIdentity: string | null;
  gateReuseContractIdentity: string;
  derivable: boolean;
};

export function buildGateReuseContract(gateId: string, map: RepositoryMap | null): GateReuseContract {
  const def = gateDef(gateId);
  const contractKind = def?.contractKind ?? "command";
  let normalizedCommandIdentity: string | null = null;
  let derivable = false;

  if (contractKind === "command") {
    normalizedCommandIdentity = deriveNormalizedCommandFromMap(gateId, map);
    derivable = normalizedCommandIdentity !== null;
  } else if (contractKind === "invariant") {
    derivable = true;
  } else {
    derivable = false;
  }

  const identityMaterial = [
    gateId,
    contractKind,
    GATE_REUSE_CONTRACT_VERSION,
    normalizedCommandIdentity ?? "",
    CACHE_POLICY_IDENTITY,
  ].join("|");

  return {
    gateId,
    contractKind,
    contractVersion: GATE_REUSE_CONTRACT_VERSION,
    normalizedCommandIdentity,
    gateReuseContractIdentity: sha256Hex(identityMaterial),
    derivable,
  };
}

const SUPPORTED_PRODUCERS: Record<string, string> = {
  vitest: "vitest",
  jest: "jest",
  tsc: "typescript",
  eslint: "eslint",
  vite: "vite",
  webpack: "webpack",
  rollup: "rollup",
  next: "next",
  tsup: "tsup",
};

const EXACT_VERSION_RE = /^\d+\.\d+\.\d+(?:[-+][\w.]+)?$/;

export type ToolchainIdentityResult = {
  provable: boolean;
  identity: Record<string, string>;
  producerFamily: string | null;
  producerVersion: string | null;
  reasonCodes: string[];
};

function scriptBodyFromNormalizedCommand(normalizedCommand: string | null): string | null {
  if (!normalizedCommand) {
    return null;
  }
  const parts = normalizedCommand.split("::");
  if (parts.length >= 2) {
    return parts.slice(1).join("::").trim();
  }
  return normalizedCommand.trim();
}

function isExactVersionSpec(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("^") || trimmed.includes("~") || trimmed.includes("*") || trimmed.includes("x")) {
    return false;
  }
  if (trimmed.startsWith(">") || trimmed.startsWith("<") || trimmed.includes("||")) {
    return false;
  }
  return EXACT_VERSION_RE.test(trimmed) || trimmed.startsWith("file:") || trimmed.startsWith("link:");
}

function readJsonUnderRepo(repoRoot: string, relativePath: string): Record<string, unknown> | null {
  const normalizedRoot = path.resolve(repoRoot);
  const target = path.resolve(repoRoot, relativePath);
  if (!target.startsWith(normalizedRoot + path.sep) && target !== normalizedRoot) {
    return null;
  }
  if (!fs.existsSync(target)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(target, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveFromNpmLock(repoRoot: string, packageName: string): string | null {
  const lock = readJsonUnderRepo(repoRoot, "package-lock.json");
  if (!lock) {
    return null;
  }
  const packages = lock.packages as Record<string, { version?: string }> | undefined;
  if (packages) {
    const direct = packages[`node_modules/${packageName}`]?.version;
    if (typeof direct === "string" && isExactVersionSpec(direct)) {
      return direct;
    }
  }
  const dependencies = lock.dependencies as Record<string, { version?: string }> | undefined;
  const nested = dependencies?.[packageName]?.version;
  if (typeof nested === "string" && isExactVersionSpec(nested)) {
    return nested;
  }
  return null;
}

function resolveFromNodeModules(repoRoot: string, packageName: string): string | null {
  const pkg = readJsonUnderRepo(repoRoot, `node_modules/${packageName}/package.json`);
  const version = pkg?.version;
  return typeof version === "string" && isExactVersionSpec(version) ? version : null;
}

function resolveFromPackageJsonExact(repoRoot: string, packageName: string): string | null {
  const pkg = readJsonUnderRepo(repoRoot, "package.json");
  if (!pkg) {
    return null;
  }
  const deps = {
    ...((pkg.dependencies as Record<string, string> | undefined) ?? {}),
    ...((pkg.devDependencies as Record<string, string> | undefined) ?? {}),
  };
  const spec = deps[packageName];
  return spec && isExactVersionSpec(spec) ? spec.trim() : null;
}

function resolveProducerVersion(repoRoot: string, npmPackage: string): { version: string | null; resolvedFrom: string | null } {
  const fromLock = resolveFromNpmLock(repoRoot, npmPackage);
  if (fromLock) {
    return { version: fromLock, resolvedFrom: "lockfile" };
  }
  const fromNodeModules = resolveFromNodeModules(repoRoot, npmPackage);
  if (fromNodeModules) {
    return { version: fromNodeModules, resolvedFrom: "node_modules" };
  }
  const fromExactDep = resolveFromPackageJsonExact(repoRoot, npmPackage);
  if (fromExactDep) {
    return { version: fromExactDep, resolvedFrom: "package-json-exact" };
  }
  return { version: null, resolvedFrom: null };
}

function detectProducerFromScript(scriptBody: string): { family: string; npmPackage: string } | null {
  const trimmed = scriptBody.trim();
  if (!trimmed) {
    return null;
  }
  const firstToken = trimmed.split(/\s+/)[0] ?? "";
  const bare = firstToken.replace(/^.*[/\\]/, "");
  const npmPackage = SUPPORTED_PRODUCERS[bare];
  if (!npmPackage) {
    return null;
  }
  const family = bare === "tsc" ? "typescript" : bare;
  return { family, npmPackage };
}

export function resolveToolchainIdentity(
  repoRoot: string,
  normalizedCommand: string | null,
  bundle: IndexBundle | null,
): ToolchainIdentityResult {
  const identity: Record<string, string> = {
    node: process.version,
    platform: process.platform,
    runtimeFamily: "node",
  };
  const reasonCodes: string[] = [];

  const pm = detectPackageManager(repoRoot);
  if (pm) {
    identity.packageManager = pm;
  }

  if (bundle) {
    for (const rel of MANIFEST_BASIS_PATHS) {
      const file = bundle.state.files.find((item) => item.path === rel);
      if (file) {
        identity[`manifestDigest:${rel}`] = file.contentDigest;
      }
    }
  }

  const scriptBody = scriptBodyFromNormalizedCommand(normalizedCommand);
  if (!scriptBody) {
    reasonCodes.push("TOOLCHAIN_UNPROVABLE");
    reasonCodes.push("MISSING_SCRIPT_BODY");
    return {
      provable: false,
      identity,
      producerFamily: null,
      producerVersion: null,
      reasonCodes,
    };
  }

  const producer = detectProducerFromScript(scriptBody);
  if (!producer) {
    reasonCodes.push("TOOLCHAIN_UNPROVABLE");
    reasonCodes.push("UNSUPPORTED_PRODUCER");
    return {
      provable: false,
      identity,
      producerFamily: null,
      producerVersion: null,
      reasonCodes,
    };
  }

  const resolved = resolveProducerVersion(repoRoot, producer.npmPackage);
  if (!resolved.version) {
    reasonCodes.push("TOOLCHAIN_UNPROVABLE");
    reasonCodes.push("PRODUCER_VERSION_UNRESOLVED");
    return {
      provable: false,
      identity,
      producerFamily: producer.family,
      producerVersion: null,
      reasonCodes,
    };
  }

  identity.producerFamily = producer.family;
  identity.producerVersion = resolved.version;
  if (resolved.resolvedFrom) {
    identity.producerResolvedFrom = resolved.resolvedFrom;
  }

  return {
    provable: true,
    identity,
    producerFamily: producer.family,
    producerVersion: resolved.version,
    reasonCodes: [],
  };
}

export function collectToolchainIdentity(
  repoRoot: string,
  normalizedCommand: string | null,
  bundle: IndexBundle | null,
): Record<string, string> {
  return resolveToolchainIdentity(repoRoot, normalizedCommand, bundle).identity;
}

export function computeReuseProofDigest(input: {
  projectId: string;
  gateReuseContractIdentity: string;
  normalizedCommandIdentity: string | null;
  validityBasisDigests: Record<string, string>;
  manifestDigests: Record<string, string>;
  toolIdentity: Record<string, string>;
  environmentIdentity: string | null;
  policyIdentity: string;
}): string {
  const lines = [
    input.projectId,
    input.gateReuseContractIdentity,
    input.normalizedCommandIdentity ?? "",
    input.policyIdentity,
    input.environmentIdentity ?? "",
    ...Object.entries(input.validityBasisDigests)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `basis:${key}=${value}`),
    ...Object.entries(input.manifestDigests)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `manifest:${key}=${value}`),
    ...Object.entries(input.toolIdentity)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `tool:${key}=${value}`),
  ];
  return sha256Hex(lines.join("\n"));
}
