import fs from "node:fs";
import { sha256Hex } from "../lib/hash.js";
import type { UadsPaths } from "../lib/workspace.js";
import { cachePaths } from "./cache-persist.js";
import { buildValidityBasis } from "./failure-memory.js";
import type { CacheDecision, CacheDecisionKind, EvidenceCacheRecord } from "./cache-types.js";
import { CACHE_SCHEMA_VERSION } from "./cache-types.js";
import {
  CACHE_POLICY_IDENTITY,
  collectEnvironmentIdentity,
  collectToolIdentity,
  isCacheEligibleGate,
  MANIFEST_BASIS_PATHS,
  normalizeCommandIdentity,
  requiresEnvironmentIdentity,
  reuseClassForGate,
} from "./cache-policy.js";
import {
  listCacheRecordIdsForGate,
  markCacheRecordStatus,
  persistCacheDecision,
  persistEvidenceCacheRecord,
  readEvidenceCacheIndex,
  readEvidenceCacheRecord,
} from "./cache-persist.js";
import type { EvidenceRecord, ExecutionRun, GateStateSnapshot } from "./execution-types.js";
import { persistEvidenceRecord } from "./execution-persist.js";
import { gateDef } from "./gates.js";
import { newPrefixedId } from "./ids.js";
import type { IndexBundle } from "./intelligence-types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function toolIdentityMatches(stored: Record<string, string>, live: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(stored), ...Object.keys(live)]);
  for (const key of keys) {
    if (stored[key] !== live[key]) {
      return false;
    }
  }
  return keys.size > 0;
}

function compareDigestMap(
  stored: Record<string, string>,
  live: Record<string, string>,
  prefix: string,
): string[] {
  const changed: string[] = [];
  const keys = new Set([...Object.keys(stored), ...Object.keys(live)]);
  for (const key of keys) {
    if (stored[key] !== live[key]) {
      changed.push(`${prefix}:${key}`);
    }
  }
  return changed.sort((a, b) => a.localeCompare(b));
}

export function manifestDigestsFromBundle(bundle: IndexBundle): Record<string, string> {
  const digests: Record<string, string> = {};
  for (const relative of MANIFEST_BASIS_PATHS) {
    const file = bundle.state.files.find((item) => item.path === relative);
    if (file) {
      digests[relative] = file.contentDigest;
    }
  }
  return digests;
}

export function buildCacheValidityBasis(
  bundle: IndexBundle,
  seedPaths: string[],
): { paths: string[]; digests: Record<string, string>; manifests: Record<string, string> } {
  const seeds = [...seedPaths, ...MANIFEST_BASIS_PATHS];
  const basis = buildValidityBasis(bundle, seeds);
  return {
    paths: basis.paths,
    digests: basis.digests,
    manifests: manifestDigestsFromBundle(bundle),
  };
}

export function indexIsReusable(bundle: IndexBundle): boolean {
  return bundle.state.complete && !bundle.state.truncated && !bundle.state.stale;
}

function decideKind(input: {
  eligible: boolean;
  blocked: boolean;
  candidate: EvidenceCacheRecord | null;
  changed: string[];
}): CacheDecisionKind {
  if (input.blocked) return "BLOCKED";
  if (!input.eligible) return "NOT_REUSABLE";
  if (!input.candidate) return "MISS";
  if (input.changed.length > 0) return "STALE";
  return "HIT";
}

export function evaluateCache(input: {
  paths: UadsPaths;
  projectId: string;
  gateId: string;
  workOrderId?: string | null;
  executionRunId?: string | null;
  liveChangeDigest?: string | null;
  bundle: IndexBundle | null;
  liveToolIdentity?: Record<string, string>;
  persistDecision?: boolean;
  schemaRoot?: string;
}): CacheDecision {
  const createdAt = nowIso();
  const eligible = isCacheEligibleGate(input.gateId);
  const reasonCodes: string[] = [];
  const changed: string[] = [];
  let candidate: EvidenceCacheRecord | null = null;
  let blocked = false;

  if (!eligible) {
    reasonCodes.push("GATE_NOT_REUSABLE");
  }
  if (!input.bundle || !indexIsReusable(input.bundle)) {
    blocked = eligible;
    reasonCodes.push(input.bundle ? "INDEX_NOT_REUSABLE" : "INDEX_UNAVAILABLE");
  } else if (input.bundle.state.projectId !== input.projectId) {
    blocked = true;
    reasonCodes.push("CROSS_PROJECT");
  }

  const index = readEvidenceCacheIndex(input.paths, input.projectId);
  if (eligible && !index) {
    blocked = true;
    reasonCodes.push("CACHE_INDEX_CORRUPT");
  }

  const liveTool = collectToolIdentity(input.liveToolIdentity);
  const liveEnv = collectEnvironmentIdentity(input.gateId);
  const liveManifests = input.bundle ? manifestDigestsFromBundle(input.bundle) : {};

  const bundle = input.bundle;
  if (eligible && !blocked && index && bundle) {
    const ids = listCacheRecordIdsForGate(input.paths, input.projectId, input.gateId);
    let sawCorrupt = false;
    for (const id of [...ids].reverse()) {
      const record = readEvidenceCacheRecord(input.paths, id, input.schemaRoot);
      if (!record) {
        sawCorrupt = true;
        continue;
      }
      if (record.projectId !== input.projectId) {
        reasonCodes.push("CROSS_PROJECT");
        blocked = true;
        candidate = record;
        break;
      }
      if (record.gateId !== input.gateId || record.evidenceStatus !== "PASS" || record.reuseClass !== "eligible") {
        continue;
      }
      candidate = record;
      if (record.policyIdentity !== CACHE_POLICY_IDENTITY) {
        changed.push("policyIdentity");
      }
      if (!toolIdentityMatches(record.toolIdentity, liveTool)) {
        changed.push("toolIdentity");
      }
      if (requiresEnvironmentIdentity(input.gateId)) {
        if (!record.environmentIdentity || record.environmentIdentity !== liveEnv) {
          changed.push("environmentIdentity");
        }
      }
      const liveBasisDigests: Record<string, string> = {};
      for (const relative of record.validityBasisPaths) {
        const current = bundle.state.files.find((file) => file.path === relative)?.contentDigest;
        if (!current) {
          changed.push(`basis:${relative}`);
          continue;
        }
        liveBasisDigests[relative] = current;
      }
      changed.push(...compareDigestMap(record.validityBasisDigests, liveBasisDigests, "basis"));
      changed.push(...compareDigestMap(record.manifestDigests, liveManifests, "manifest"));
      if (record.indexDigest && input.bundle && record.indexDigest !== input.bundle.state.indexDigest) {
        // Index digest churn alone does not invalidate when the proven basis still matches.
      }
      if (changed.length > 0) {
        markCacheRecordStatus(input.paths, record.cacheRecordId, "stale", changed.join(","), input.schemaRoot);
      }
      break;
    }
    if (!candidate && sawCorrupt) {
      blocked = true;
      reasonCodes.push("CACHE_RECORD_CORRUPT");
    } else if (!candidate) {
      reasonCodes.push("NO_CANDIDATE");
    }
  }

  const decision = decideKind({ eligible, blocked, candidate, changed: [...new Set(changed)] });
  if (decision === "HIT") {
    reasonCodes.push("VALIDITY_BASIS_MATCH");
  } else if (decision === "STALE") {
    reasonCodes.push("VALIDITY_BASIS_CHANGED");
  }

  const uniqueReasons = [...new Set(reasonCodes)];
  const uniqueChanged = [...new Set(changed)].sort((a, b) => a.localeCompare(b));
  const result: CacheDecision = {
    schema: "uads.cache-decision",
    schemaVersion: CACHE_SCHEMA_VERSION,
    cacheDecisionId: newPrefixedId(
      "cd",
      `${input.projectId}:${input.gateId}:${input.liveChangeDigest ?? ""}:${createdAt}:${decision}`,
    ),
    projectId: input.projectId,
    workOrderId: input.workOrderId ?? null,
    executionRunId: input.executionRunId ?? null,
    gateId: input.gateId,
    candidateCacheRecordId: candidate?.cacheRecordId ?? null,
    decision,
    reasonCodes: uniqueReasons,
    changedValidityInputs: uniqueChanged,
    executionRequired: decision !== "HIT",
    maySatisfyGate: decision === "HIT",
    liveChangeDigest: input.liveChangeDigest ?? null,
    indexDigest: input.bundle?.state.indexDigest ?? null,
    createdAt,
  };
  if (input.persistDecision !== false) {
    try {
      persistCacheDecision(input.paths, result, input.schemaRoot);
    } catch {
      // Explainability write must not corrupt the authoritative execution path.
    }
  }
  return result;
}

export function populateCacheFromEvidence(input: {
  paths: UadsPaths;
  run: ExecutionRun;
  record: EvidenceRecord;
  bundle: IndexBundle;
  schemaRoot?: string;
}): EvidenceCacheRecord | null {
  if (input.record.status !== "PASS" || input.record.projectId !== input.run.projectId) {
    return null;
  }
  const def = gateDef(input.record.gateId);
  if (!def) {
    return null;
  }
  const reuseClass = reuseClassForGate(input.record.gateId);
  if (reuseClass !== "eligible") {
    return null;
  }
  if (input.record.kind === "command" && (!input.record.command || !input.record.outputDigest || input.record.exitCode !== 0)) {
    return null;
  }
  if (!indexIsReusable(input.bundle) || input.bundle.state.projectId !== input.run.projectId) {
    return null;
  }
  const basis = buildCacheValidityBasis(input.bundle, input.run.changedFiles);
  const createdAt = nowIso();
  const cacheRecord: EvidenceCacheRecord = {
    schema: "uads.evidence-cache-record",
    schemaVersion: CACHE_SCHEMA_VERSION,
    cacheRecordId: newPrefixedId("ecr", `${input.run.projectId}:${input.record.gateId}:${input.record.outputDigest ?? input.record.fileDigest ?? createdAt}`),
    projectId: input.run.projectId,
    originatingWorkOrderId: input.record.workOrderId,
    originatingExecutionRunId: input.record.executionRunId,
    gateId: input.record.gateId,
    evidenceId: input.record.evidenceId,
    evidenceStatus: "PASS",
    evidenceKind: input.record.kind === "review" ? "command" : input.record.kind,
    originatingChangeDigest: input.record.changeDigest,
    command: normalizeCommandIdentity(input.record.command),
    toolIdentity: collectToolIdentity(),
    environmentIdentity: collectEnvironmentIdentity(input.record.gateId),
    validityBasisPaths: basis.paths,
    validityBasisDigests: basis.digests,
    manifestDigests: basis.manifests,
    indexDigest: input.bundle.state.indexDigest,
    policyIdentity: CACHE_POLICY_IDENTITY,
    outputDigest: input.record.outputDigest ?? null,
    fileDigest: input.record.fileDigest ?? null,
    createdAt,
    reuseClass,
    reusable: true,
    status: "reusable",
    invalidationReason: null,
  };
  return persistEvidenceCacheRecord(input.paths, cacheRecord, input.schemaRoot);
}

export function applyEligibleCacheHits(input: {
  paths: UadsPaths;
  run: ExecutionRun;
  bundle: IndexBundle | null;
  gateStates: GateStateSnapshot[];
  schemaRoot?: string;
}): { applied: EvidenceRecord[]; decisions: CacheDecision[] } {
  const applied: EvidenceRecord[] = [];
  const decisions: CacheDecision[] = [];
  for (const gate of input.run.selectedGates) {
    if (!isCacheEligibleGate(gate)) {
      const decision = evaluateCache({
        paths: input.paths,
        projectId: input.run.projectId,
        gateId: gate,
        workOrderId: input.run.workOrderId,
        executionRunId: input.run.executionRunId,
        liveChangeDigest: input.run.currentChangeDigest,
        bundle: input.bundle,
        schemaRoot: input.schemaRoot,
      });
      decisions.push(decision);
      continue;
    }
    const current = input.gateStates.find((item) => item.gateId === gate);
    if (current && (current.status === "FAIL" || current.status === "BLOCKED" || current.status === "PASS")) {
      continue;
    }
    const decision = evaluateCache({
      paths: input.paths,
      projectId: input.run.projectId,
      gateId: gate,
      workOrderId: input.run.workOrderId,
      executionRunId: input.run.executionRunId,
      liveChangeDigest: input.run.currentChangeDigest,
      bundle: input.bundle,
      schemaRoot: input.schemaRoot,
    });
    decisions.push(decision);
    if (decision.decision !== "HIT" || !decision.candidateCacheRecordId || !input.run.currentChangeDigest) {
      continue;
    }
    const cacheRecord = readEvidenceCacheRecord(input.paths, decision.candidateCacheRecordId, input.schemaRoot);
    if (!cacheRecord || cacheRecord.projectId !== input.run.projectId || !cacheRecord.reusable) {
      continue;
    }
    const createdAt = nowIso();
    const derived: EvidenceRecord = {
      schema: "uads.evidence-record",
      schemaVersion: "0.3.0",
      evidenceId: newPrefixedId("ev", `${input.run.executionRunId}:${gate}:cache:${decision.cacheDecisionId}`),
      projectId: input.run.projectId,
      workOrderId: input.run.workOrderId,
      executionRunId: input.run.executionRunId,
      changeDigest: input.run.currentChangeDigest,
      gateId: gate,
      sourceRole: "evidence-cache",
      kind: cacheRecord.evidenceKind,
      createdAt,
      status: "PASS",
      summary: `cache-reuse of ${cacheRecord.cacheRecordId}`,
      command: cacheRecord.command ?? undefined,
      exitCode: cacheRecord.evidenceKind === "command" ? 0 : undefined,
      outputRef: cacheRecord.outputDigest ? `sidecar://cache/evidence/${cacheRecord.cacheRecordId}` : null,
      outputDigest: cacheRecord.outputDigest,
      fileRef: null,
      fileDigest: cacheRecord.fileDigest,
      source: "cache-reuse",
      sourceCacheRecordId: cacheRecord.cacheRecordId,
      sourceEvidenceId: cacheRecord.evidenceId,
      cacheDecisionId: decision.cacheDecisionId,
    };
    persistEvidenceRecord({ paths: input.paths, record: derived, schemaRoot: input.schemaRoot });
    applied.push(derived);
  }
  return { applied, decisions };
}

export function readCacheStatusCompact(paths: UadsPaths, projectId: string): {
  reusableRecords: number;
  staleRecords: number;
  notReusableRecords: number;
  indexedRecords: number;
  indexCorrupt: boolean;
} {
  const index = readEvidenceCacheIndex(paths, projectId);
  if (!index) {
    return {
      reusableRecords: 0,
      staleRecords: 0,
      notReusableRecords: 0,
      indexedRecords: 0,
      indexCorrupt: fs.existsSync(cachePaths(paths).index),
    };
  }
  return {
    reusableRecords: index.records.filter((item) => item.status === "reusable").length,
    staleRecords: index.records.filter((item) => item.status === "stale").length,
    notReusableRecords: index.records.filter((item) => item.status === "not-reusable").length,
    indexedRecords: index.records.length,
    indexCorrupt: false,
  };
}

export function layerDigestForItems(items: Array<{ layer: string; path: string; contentDigest: string }>, layer: string): string {
  const parts = items
    .filter((item) => item.layer === layer)
    .map((item) => `${item.path}:${item.contentDigest}`)
    .sort((a, b) => a.localeCompare(b));
  return sha256Hex(parts.join("|") || layer);
}
