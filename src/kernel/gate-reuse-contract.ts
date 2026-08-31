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

export function collectToolchainIdentity(
  repoRoot: string,
  normalizedCommand: string | null,
  bundle: IndexBundle | null,
): Record<string, string> {
  const identity: Record<string, string> = {
    node: process.version,
    platform: process.platform,
    runtimeFamily: "node",
  };

  const pm = detectPackageManager(repoRoot);
  if (pm) {
    identity.packageManager = pm;
  }

  const pkgPath = path.join(repoRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const cmd = (normalizedCommand ?? "").toLowerCase();

      if (deps.vitest || cmd.includes("vitest")) {
        identity.testRunnerFamily = "vitest";
        identity.testRunnerVersion = deps.vitest ?? "unknown";
      }
      if (deps.jest || cmd.includes("jest")) {
        identity.testRunnerFamily = "jest";
        identity.testRunnerVersion = deps.jest ?? "unknown";
      }
      if (deps.typescript || cmd.includes("tsc")) {
        identity.compilerFamily = "typescript";
        identity.compilerVersion = deps.typescript ?? "unknown";
      }
      if (deps.eslint || cmd.includes("eslint")) {
        identity.linterFamily = "eslint";
        identity.linterVersion = deps.eslint ?? "unknown";
      }
    } catch {
      identity.toolchainParse = "package-json-unreadable";
    }
  } else if (normalizedCommand) {
    identity.toolchainParse = "no-package-json";
  }

  if (bundle) {
    for (const rel of MANIFEST_BASIS_PATHS) {
      const file = bundle.state.files.find((item) => item.path === rel);
      if (file) {
        identity[`manifestDigest:${rel}`] = file.contentDigest;
      }
    }
  }

  return identity;
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
