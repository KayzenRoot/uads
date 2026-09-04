import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ASSURANCE_REASON_CODES, evaluateAssurancePolicy } from "../kernel/assurance-policy.js";
import type { EvidenceRecord, ExecutionRun, GateStateSnapshot, ReviewRecord } from "../kernel/execution-types.js";
import type { WorkOrder } from "../kernel/types.js";
import { findPackageRoot } from "../lib/version.js";

type EvalCase = { id: string; name: string };
const DIGEST = "a".repeat(64);
const PROJECT = "assurance-eval-project";
const WORK_ORDER = "wo-assurance-eval";
const RUN = "er-assurance-eval";

function order(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    schema: "uads.work-order", schemaVersion: "0.2.0", workOrderId: WORK_ORDER, projectId: PROJECT,
    title: "Assurance eval", objective: "Validate deterministic assurance", status: "active",
    createdAt: "2026-09-04T00:00:00.000Z", updatedAt: "2026-09-04T00:00:00.000Z", intakeRef: "sidecar://intake",
    routingDecisionId: "rd-assurance-eval", scopeClass: "local", includedScope: ["src"], outOfScope: ["outside"],
    recommendations: [], riskLevel: "LOW", riskReasons: [], domains: ["general"], affectedAreas: [],
    specialists: ["implementation-agent"], assuranceReviewers: ["independent-reviewer"], qualityGates: ["unit-test"],
    contextRadius: "C1", tokenBudget: { softLimit: 1000, hardLimit: 2000, capabilityClass: "economy", cachePreference: "refresh", expansionPolicy: "bounded" },
    dependencies: [], acceptanceCriteria: ["verified"], requiredEvidence: [], stopConditions: ["stop"],
    autonomyBoundary: { safeAutonomous: ["edit"], requiresApproval: ["release"] }, nextAction: "review", ...overrides,
  };
}

function run(current: Partial<ExecutionRun> = {}): ExecutionRun {
  return {
    schema: "uads.execution-run", schemaVersion: "0.3.0", executionRunId: RUN, projectId: PROJECT,
    workOrderId: WORK_ORDER, routingDecisionId: "rd-assurance-eval", createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z", attempt: 1, phase: "review", status: "in_progress",
    baseline: { gitHead: "b".repeat(40), dirty: false, capturedAt: "2026-09-04T00:00:00.000Z" }, contextRadius: "C1",
    contextCandidates: ["src"], implementerRole: "implementation-agent", implementerSessionId: "impl-1",
    requiredReviewers: ["independent-reviewer"], selectedGates: ["unit-test"], currentChangeDigest: DIGEST,
    reviewedChangeDigest: null, changedFiles: ["src/index.ts"], scopeViolations: [], evidenceRefs: [], reviewRefs: [],
    blockers: [], nextAction: "review", expansionHistory: [], ...current,
  };
}

function evidence(gateId = "unit-test", status: "PASS" | "FAIL" | "BLOCKED" = "PASS"): EvidenceRecord {
  return {
    schema: "uads.evidence-record", schemaVersion: "0.3.0", evidenceId: `ev-${gateId}`, projectId: PROJECT,
    workOrderId: WORK_ORDER, executionRunId: RUN, changeDigest: DIGEST, gateId, sourceRole: "test-engineer", kind: "command",
    createdAt: "2026-09-04T00:00:00.000Z", status, summary: status, command: "fixture", exitCode: status === "PASS" ? 0 : 1,
    outputRef: "sidecar://output", outputDigest: DIGEST, source: "executed",
  };
}

function review(role: string, verdict: "APPROVED" | "CORRECTION_NEEDED" | "BLOCKED" = "APPROVED", changes: Partial<ReviewRecord> = {}): ReviewRecord {
  return {
    schema: "uads.review-record", schemaVersion: "0.3.0", reviewId: `rv-${role}`, projectId: PROJECT,
    workOrderId: WORK_ORDER, executionRunId: RUN, changeDigest: DIGEST, reviewerRole: role,
    reviewSessionId: `session-${role}`, implementerRole: "implementation-agent", implementerSessionId: "impl-1",
    verdict, summary: "fixture review", findings: [], reasonCodes: verdict === "APPROVED" ? [] : [ASSURANCE_REASON_CODES.REVIEW_BLOCKED],
    evidenceRefs: ["sidecar://execution-runs/er-assurance-eval/evidence/ev-unit-test.json"],
    createdAt: "2026-09-04T00:00:00.000Z", ...changes,
  };
}

function evaluate(input: {
  mode?: "status" | "submission" | "finalize";
  workOrder?: Partial<WorkOrder>;
  run?: Partial<ExecutionRun>;
  evidence?: EvidenceRecord[];
  gateStates?: GateStateSnapshot[];
  reviews?: ReviewRecord[];
  candidate?: ReviewRecord;
} = {}) {
  const currentOrder = order(input.workOrder);
  const currentRun = run({ ...input.run, requiredReviewers: currentOrder.assuranceReviewers, selectedGates: currentOrder.qualityGates });
  const currentEvidence = input.evidence ?? [evidence()];
  const states = input.gateStates ?? currentRun.selectedGates.map((gateId) => ({ gateId, status: "PASS" as const, evidenceId: `ev-${gateId}` }));
  return evaluateAssurancePolicy({
    mode: input.mode ?? "finalize", projectId: PROJECT, workOrder: currentOrder, run: currentRun,
    gateStates: states, evidence: currentEvidence, reviews: input.reviews ?? [review("independent-reviewer")],
    candidate: input.candidate, specialistSelectionValid: true,
  });
}

function assertBlocked(result: ReturnType<typeof evaluate>, code: string): void {
  if (result.allowed || !result.reasonCodes.some((item) => item === code)) throw new Error(`expected ${code}, got ${result.reasonCodes.join(",")}`);
}

function runCase(id: string): void {
  if (id === "AS1") {
    if (!evaluate().allowed) throw new Error("happy path was blocked");
  } else if (id === "AS2") {
    assertBlocked(evaluate({ mode: "submission", candidate: review("implementation-agent") }), ASSURANCE_REASON_CODES.UNKNOWN_REVIEWER_ROLE);
  } else if (id === "AS3") {
    assertBlocked(evaluate({ mode: "submission", candidate: review("independent-reviewer", "APPROVED", { reviewSessionId: "impl-1" }) }), ASSURANCE_REASON_CODES.IMPLEMENTER_SESSION_REVIEW);
  } else if (id === "AS4") {
    assertBlocked(evaluate({ reviews: [review("independent-reviewer", "APPROVED", { changeDigest: "c".repeat(64) })] }), ASSURANCE_REASON_CODES.MISSING_REQUIRED_REVIEWER);
  } else if (id === "AS5" || id === "AS6" || id === "AS7") {
    const role = id === "AS5" ? "security-reviewer" : id === "AS6" ? "performance-reviewer" : "reliability-reviewer";
    const gates = id === "AS5" ? ["unit-test", "security-review"] : id === "AS6" ? ["unit-test", "performance-check"] : ["unit-test", "rollback-validation"];
    assertBlocked(evaluate({ workOrder: { assuranceReviewers: ["independent-reviewer", role], qualityGates: gates }, run: {}, gateStates: gates.map((gateId) => ({ gateId, status: gateId === "unit-test" ? "PASS" as const : "PENDING" as const, evidenceId: gateId === "unit-test" ? "ev-unit-test" : null })), evidence: [evidence()] }), ASSURANCE_REASON_CODES.MISSING_REQUIRED_REVIEWER);
  } else if (id === "AS8" || id === "AS9") {
    const severity = id === "AS8" ? "HIGH" : "CRITICAL";
    assertBlocked(evaluate({ reviews: [review("independent-reviewer", "APPROVED", { findings: [{ severity, category: "fixture", message: "blocking" }] })] }), id === "AS8" ? ASSURANCE_REASON_CODES.APPROVAL_CONTRADICTS_HIGH_FINDING : ASSURANCE_REASON_CODES.APPROVAL_CONTRADICTS_CRITICAL_FINDING);
  } else if (id === "AS10" || id === "AS11") {
    const required = id === "AS10" ? "performance-reviewer" : "security-reviewer";
    const wrong = id === "AS10" ? "security-reviewer" : "performance-reviewer";
    assertBlocked(evaluate({ workOrder: { assuranceReviewers: ["independent-reviewer", required] }, reviews: [review("independent-reviewer"), review(wrong)] }), ASSURANCE_REASON_CODES.REVIEWER_ROLE_NOT_REQUIRED);
  } else if (id === "AS12") {
    assertBlocked(evaluate({ workOrder: { assuranceReviewers: ["reliability-reviewer"], qualityGates: ["rollback-validation"] }, gateStates: [{ gateId: "rollback-validation", status: "PENDING", evidenceId: null }], evidence: [], reviews: [review("reliability-reviewer", "APPROVED", { evidenceRefs: [] })] }), ASSURANCE_REASON_CODES.RELIABILITY_OBLIGATION_UNSATISFIED);
  } else if (id === "AS13") {
    assertBlocked(evaluate({ gateStates: [{ gateId: "unit-test", status: "FAIL", evidenceId: "ev-unit-test" }], evidence: [evidence("unit-test", "FAIL")] }), ASSURANCE_REASON_CODES.CURRENT_FAIL_BLOCKED_EVIDENCE);
  } else if (id === "AS14") {
    assertBlocked(evaluate({ reviews: [review("independent-reviewer", "APPROVED", { projectId: "foreign-project" })] }), ASSURANCE_REASON_CODES.MISSING_REQUIRED_REVIEWER);
  } else if (id === "AS15") {
    assertBlocked(evaluate({ workOrder: { assuranceReviewers: ["independent-reviewer", "security-reviewer"] }, reviews: [review("independent-reviewer", "APPROVED", { reviewSessionId: "same" }), review("security-reviewer", "APPROVED", { reviewSessionId: "same" })] }), ASSURANCE_REASON_CODES.DUPLICATE_REVIEW_SESSION);
  } else if (id === "AS16") {
    const first = review("independent-reviewer");
    if (!evaluate({ reviews: [first] }).allowed) throw new Error("initial assurance was not valid");
    assertBlocked(evaluate({ reviews: [{ ...first, findings: [{ severity: "HIGH", category: "tamper", message: "persisted tamper" }] }] }), ASSURANCE_REASON_CODES.APPROVAL_CONTRADICTS_HIGH_FINDING);
  } else {
    throw new Error(`unknown assurance case ${id}`);
  }
}

export function runAssuranceEvals(): number {
  const root = findPackageRoot();
  const cases = JSON.parse(fs.readFileSync(path.join(root, "evals/assurance/cases.json"), "utf8")) as EvalCase[];
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "uads-assurance-eval-"));
  const failures: string[] = [];
  try {
    for (const item of cases) {
      try { runCase(item.id); process.stdout.write(`AS${item.id.slice(2)} PASS ${item.name}\n`); }
      catch (error) { failures.push(`${item.id}: ${error instanceof Error ? error.message : String(error)}`); process.stdout.write(`FAIL ${item.id} ${item.name}\n`); }
    }
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
  process.stdout.write(`\n${cases.length - failures.length} passed, ${failures.length} failed, ${cases.length} total\n`);
  if (failures.length) { process.stderr.write(`${failures.join("\n")}\n`); return 1; }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) process.exit(runAssuranceEvals());
