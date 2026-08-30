import fs from "node:fs";
import {
  failurePaths,
  persistFailureMemory,
  persistFailureRecord,
  readFailureMemory,
  readFailureRecord,
} from "./failure-persist.js";
import type {
  FailureMemory,
  FailureMemoryEntry,
  FailureRecord,
  MemoryMatch,
  RankedCandidate,
} from "./failure-types.js";
import { FailureStateError } from "./failure-types.js";
import type { IndexBundle } from "./intelligence-types.js";
import type { UadsPaths } from "../lib/workspace.js";

function nowIso(): string {
  return new Date().toISOString();
}

function emptyMemory(projectId: string): FailureMemory {
  return {
    schema: "uads.failure-memory",
    schemaVersion: "0.5.0",
    projectId,
    updatedAt: nowIso(),
    entries: [],
  };
}

function loadMemory(paths: UadsPaths, projectId: string, schemaRoot?: string): FailureMemory {
  if (!fs.existsSync(failurePaths(paths).memory)) {
    return emptyMemory(projectId);
  }
  return readFailureMemory(paths, projectId, schemaRoot);
}

export function upsertFailureOccurrence(input: {
  paths: UadsPaths;
  projectId: string;
  record: FailureRecord;
  candidates?: RankedCandidate[];
  schemaRoot?: string;
}): FailureMemory {
  const memory = loadMemory(input.paths, input.projectId, input.schemaRoot);
  const existing = memory.entries.find((entry) => entry.failureSignature === input.record.signature);
  const at = input.record.createdAt;
  const candidatePaths = (input.candidates ?? []).map((item) => item.path);
  if (!existing) {
    memory.entries.push({
      failureSignature: input.record.signature,
      firstSeenAt: at,
      lastSeenAt: at,
      occurrences: 1,
      lastRepositoryHead: input.record.repositoryHead,
      lastChangeDigest: input.record.changeDigest,
      sameDigestStreak: 0,
      candidatePaths,
      candidateDigests: {},
      verifiedRootCausePaths: [],
      disprovedPaths: [],
      resolutionSummary: null,
      resolutionEvidenceRefs: [],
      lastOutcome: "open",
    });
  } else {
    existing.lastSeenAt = at;
    existing.occurrences += 1;
    existing.lastRepositoryHead = input.record.repositoryHead;
    if (input.record.changeDigest && existing.lastChangeDigest && existing.lastChangeDigest !== input.record.changeDigest) {
      existing.sameDigestStreak = 0;
    }
    existing.lastChangeDigest = input.record.changeDigest;
    if (candidatePaths.length > 0) existing.candidatePaths = candidatePaths;
  }
  memory.updatedAt = at;
  return persistFailureMemory(input.paths, memory, input.schemaRoot);
}

export function noteDiagnosisAttempt(input: {
  paths: UadsPaths;
  projectId: string;
  signature: string;
  changeDigest: string | null;
  candidates: RankedCandidate[];
  candidateDigests: Record<string, string>;
  schemaRoot?: string;
}): FailureMemoryEntry {
  const memory = loadMemory(input.paths, input.projectId, input.schemaRoot);
  const existing = memory.entries.find((entry) => entry.failureSignature === input.signature);
  if (!existing) {
    throw new FailureStateError("failure memory entry missing for diagnosis");
  }
  if (input.changeDigest && existing.lastChangeDigest === input.changeDigest) {
    existing.sameDigestStreak += 1;
  } else {
    existing.sameDigestStreak = 1;
    existing.lastChangeDigest = input.changeDigest;
  }
  existing.candidatePaths = input.candidates.map((item) => item.path);
  existing.candidateDigests = input.candidateDigests;
  existing.lastSeenAt = nowIso();
  if (existing.sameDigestStreak >= 3) existing.lastOutcome = "loop";
  memory.updatedAt = existing.lastSeenAt;
  persistFailureMemory(input.paths, memory, input.schemaRoot);
  return existing;
}

function pathDigest(bundle: IndexBundle, relative: string): string | null {
  return bundle.state.files.find((file) => file.path === relative)?.contentDigest ?? null;
}

export function evaluateMemoryMatch(input: {
  projectId: string;
  signature: string;
  memory: FailureMemory;
  bundle: IndexBundle;
}): MemoryMatch | null {
  if (input.memory.projectId !== input.projectId) return null;
  const entry = input.memory.entries.find((item) => item.failureSignature === input.signature);
  if (!entry) return null;
  if (entry.lastOutcome !== "resolved" && Object.keys(entry.candidateDigests).length === 0 && entry.occurrences <= 1) {
    return null;
  }
  const indexed = new Set(input.bundle.state.files.map((file) => file.path));
  const candidates = entry.verifiedRootCausePaths.length > 0 ? entry.verifiedRootCausePaths : entry.candidatePaths;
  const stillPresent = candidates.length > 0 && candidates.every((item) => indexed.has(item));
  const digestsMatch =
    stillPresent &&
    candidates.every((item) => {
      const previous = entry.candidateDigests[item];
      const current = pathDigest(input.bundle, item);
      return Boolean(previous) && previous === current;
    });
  const complete = input.bundle.state.complete && !input.bundle.state.truncated && !input.bundle.state.stale;
  if (entry.lastOutcome === "resolved" && stillPresent && digestsMatch && complete) {
    return {
      failureSignature: entry.failureSignature,
      kind: "reusable",
      reason: "verified recurrence with compatible candidate digests (advisory, not proof)",
    };
  }
  return {
    failureSignature: entry.failureSignature,
    kind: "historical",
    reason: !stillPresent
      ? "historical candidate path missing from current index"
      : !digestsMatch
        ? "candidate or dependency digest changed; memory is historical"
        : !complete
          ? "index is not current; memory is historical"
          : "prior observation without current verified validity",
  };
}

export function markVerifiedResolution(input: {
  paths: UadsPaths;
  projectId: string;
  failureRecordId: string;
  changeDigest: string;
  evidenceRefs: string[];
  schemaRoot?: string;
}): FailureMemory {
  if (input.evidenceRefs.length === 0) {
    throw new FailureStateError("verified resolution requires bound evidence refs");
  }
  const record = readFailureRecord(input.paths, input.failureRecordId, input.schemaRoot);
  if (record.projectId !== input.projectId) {
    throw new FailureStateError("cross-project failure resolution rejected");
  }
  if (record.changeDigest && record.changeDigest === input.changeDigest) {
    throw new FailureStateError("verified resolution requires a new change digest");
  }
  const memory = loadMemory(input.paths, input.projectId, input.schemaRoot);
  const entry = memory.entries.find((item) => item.failureSignature === record.signature);
  if (!entry) {
    throw new FailureStateError("failure memory entry missing for resolution");
  }
  const verified = entry.candidatePaths.filter((item) => !entry.disprovedPaths.includes(item));
  entry.verifiedRootCausePaths = verified;
  entry.resolutionEvidenceRefs = input.evidenceRefs;
  entry.resolutionSummary = "resolved after verified corrective execution";
  entry.lastOutcome = "resolved";
  entry.lastChangeDigest = input.changeDigest;
  entry.lastSeenAt = nowIso();
  memory.updatedAt = entry.lastSeenAt;
  persistFailureMemory(input.paths, memory, input.schemaRoot);
  persistFailureRecord(input.paths, { ...record, status: "resolved" }, input.schemaRoot, { updateCursor: false });
  return memory;
}

export function compactFailureRows(memory: FailureMemory): Array<{
  signaturePrefix: string;
  occurrences: number;
  lastOutcome: string;
  lastSeenAt: string;
  reusable: boolean;
}> {
  return memory.entries
    .slice()
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
    .map((entry) => ({
      signaturePrefix: entry.failureSignature.slice(0, 12),
      occurrences: entry.occurrences,
      lastOutcome: entry.lastOutcome,
      lastSeenAt: entry.lastSeenAt,
      reusable: entry.lastOutcome === "resolved" && entry.verifiedRootCausePaths.length > 0,
    }));
}
