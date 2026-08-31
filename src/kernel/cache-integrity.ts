import type { UadsPaths } from "../lib/workspace.js";
import { readCacheDecision, readEvidenceCacheRecord } from "./cache-persist.js";
import type { EvidenceRecord } from "./execution-types.js";

export type CacheReuseValidationResult = {
  valid: boolean;
  reasonCodes: string[];
};

const PROVENANCE_FIELDS = [
  "sourceCacheRecordId",
  "sourceEvidenceId",
  "cacheDecisionId",
  "reuseProofDigest",
  "gateReuseContractIdentity",
] as const;

export function validateCacheReuseEvidence(input: {
  paths: UadsPaths;
  projectId: string;
  gateId: string;
  changeDigest: string | null;
  record: EvidenceRecord;
  schemaRoot?: string;
}): CacheReuseValidationResult {
  if (input.record.source !== "cache-reuse") {
    return { valid: true, reasonCodes: [] };
  }

  const reasonCodes: string[] = [];

  for (const field of PROVENANCE_FIELDS) {
    const value = input.record[field];
    if (!value || String(value).trim().length === 0) {
      reasonCodes.push(`MISSING_${field.toUpperCase()}`);
    }
  }

  if (input.record.projectId !== input.projectId) {
    reasonCodes.push("PROJECT_MISMATCH");
  }
  if (input.record.gateId !== input.gateId) {
    reasonCodes.push("GATE_MISMATCH");
  }
  if (input.changeDigest && input.record.changeDigest !== input.changeDigest) {
    reasonCodes.push("CHANGE_DIGEST_MISMATCH");
  }

  if (reasonCodes.length > 0) {
    return { valid: false, reasonCodes };
  }

  const decision = readCacheDecision(input.paths, input.record.cacheDecisionId!, input.schemaRoot);
  if (!decision) {
    return { valid: false, reasonCodes: ["MISSING_CACHE_DECISION"] };
  }
  if (decision.projectId !== input.projectId) {
    reasonCodes.push("DECISION_PROJECT_MISMATCH");
  }
  if (decision.gateId !== input.gateId) {
    reasonCodes.push("DECISION_GATE_MISMATCH");
  }
  if (decision.decision !== "HIT" || !decision.maySatisfyGate) {
    reasonCodes.push("DECISION_NOT_HIT");
  }
  if (decision.candidateCacheRecordId !== input.record.sourceCacheRecordId) {
    reasonCodes.push("DECISION_CACHE_RECORD_MISMATCH");
  }
  if (decision.reuseProofDigest !== input.record.reuseProofDigest) {
    reasonCodes.push("DECISION_PROOF_MISMATCH");
  }
  if (decision.gateReuseContractIdentity !== input.record.gateReuseContractIdentity) {
    reasonCodes.push("DECISION_CONTRACT_MISMATCH");
  }

  const cacheRecord = readEvidenceCacheRecord(input.paths, input.record.sourceCacheRecordId!, input.schemaRoot);
  if (!cacheRecord) {
    return { valid: false, reasonCodes: ["MISSING_CACHE_RECORD", ...reasonCodes] };
  }
  if (cacheRecord.projectId !== input.projectId) {
    reasonCodes.push("CACHE_RECORD_PROJECT_MISMATCH");
  }
  if (cacheRecord.gateId !== input.gateId) {
    reasonCodes.push("CACHE_RECORD_GATE_MISMATCH");
  }
  if (cacheRecord.evidenceId !== input.record.sourceEvidenceId) {
    reasonCodes.push("SOURCE_EVIDENCE_MISMATCH");
  }
  if (cacheRecord.reuseProofDigest !== input.record.reuseProofDigest) {
    reasonCodes.push("CACHE_RECORD_PROOF_MISMATCH");
  }
  if (cacheRecord.gateReuseContractIdentity !== input.record.gateReuseContractIdentity) {
    reasonCodes.push("CACHE_RECORD_CONTRACT_MISMATCH");
  }

  return { valid: reasonCodes.length === 0, reasonCodes };
}
