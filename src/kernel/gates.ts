export type GateDef = {
  id: string;
  evidence: string;
  purpose: string;
};

export const GATE_REGISTRY: GateDef[] = [
  { id: "static", evidence: "gate:static", purpose: "static analysis" },
  { id: "unit-test", evidence: "gate:unit-test", purpose: "focused unit/smoke tests" },
  { id: "integration-test", evidence: "gate:integration-test", purpose: "integration coverage" },
  { id: "contract-test", evidence: "gate:contract-test", purpose: "public contract assertions" },
  { id: "build", evidence: "gate:build", purpose: "compile/build" },
  { id: "security-review", evidence: "gate:security-review", purpose: "independent security review" },
  { id: "dependency-audit", evidence: "gate:dependency-audit", purpose: "dependency/supply-chain audit" },
  { id: "performance-check", evidence: "gate:performance-check", purpose: "hot-path regression check" },
  { id: "architecture-conformance", evidence: "gate:architecture-conformance", purpose: "architecture conformance" },
  { id: "database-migration", evidence: "gate:database-migration", purpose: "migration test" },
  { id: "rollback-validation", evidence: "gate:rollback-validation", purpose: "rollback/integrity validation" },
  { id: "web3-unit", evidence: "gate:web3-unit", purpose: "contract unit tests" },
  { id: "web3-fuzz", evidence: "gate:web3-fuzz", purpose: "contract fuzzing" },
  { id: "web3-invariant", evidence: "gate:web3-invariant", purpose: "contract invariants" },
  { id: "financial-numerical-validation", evidence: "gate:financial-numerical-validation", purpose: "numerical validation" },
  { id: "simulation-invariant", evidence: "gate:simulation-invariant", purpose: "simulation invariants" },
  { id: "release-check", evidence: "gate:release-check", purpose: "release readiness" },
];

export const MANDATORY_GATE_IDS = GATE_REGISTRY.map((gate) => gate.id);

export function gateEvidence(id: string): string {
  return GATE_REGISTRY.find((gate) => gate.id === id)?.evidence ?? `gate:${id}`;
}

export function assertUniqueGateIds(): void {
  if (new Set(MANDATORY_GATE_IDS).size !== MANDATORY_GATE_IDS.length) {
    throw new Error("gate registry contains duplicate IDs");
  }
}

export const REVIEW_GATE_ROLES: Record<string, string> = {
  "security-review": "security-reviewer",
  "performance-check": "performance-reviewer",
};

export function isReviewGate(gateId: string): boolean {
  return Object.prototype.hasOwnProperty.call(REVIEW_GATE_ROLES, gateId);
}

export function isKnownGateId(gateId: string): boolean {
  return GATE_REGISTRY.some((gate) => gate.id === gateId);
}
