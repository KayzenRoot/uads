import { computeProjectFingerprint } from "../lib/fingerprint.js";
import { readGitSummary } from "../lib/git.js";
import { sha256Hex } from "../lib/hash.js";
import { findPackageRoot } from "../lib/version.js";
import { ensureWorkspace, readOrCreateProfile, type UadsPaths } from "../lib/workspace.js";
import { inspectRepository } from "./inspector.js";
import { newPrefixedId, titleFromObjective } from "./ids.js";
import { intakeFromRequest, normalizeIntake } from "./intake.js";
import {
  classifyRisk,
  classifyScopeSize,
  selectCapabilityClass,
  selectContextRadius,
  selectDomains,
  TOKEN_BUDGETS,
} from "./policy.js";
import { classifyRequestedWork } from "./scope-control.js";
import { selectContextCandidates } from "./context-candidates.js";
import { gateEvidence } from "./gates.js";
import {
  assertIndependentReview,
  autonomyBoundary,
  selectGates,
  selectSpecialists,
} from "./routing.js";
import { inspectCurrentState, persistPlan, readCurrentCheckpoint, readRoutingDecision, readWorkOrder } from "./persist.js";
import type {
  Checkpoint,
  ContextPlan,
  NormalizedIntake,
  RepositoryMap,
  ResumePacket,
  RoutingDecision,
  WorkOrder,
} from "./types.js";
import { IMPLEMENTER_ROLE } from "./types.js";

function projectContext(cwd: string, uadsHome?: string): {
  repoRoot: string;
  projectId: string;
  fingerprint: ReturnType<typeof computeProjectFingerprint>;
  paths: UadsPaths;
} {
  const git = readGitSummary(cwd);
  const repoRoot = git.repoRoot ?? cwd;
  const fingerprint = computeProjectFingerprint({ originUrl: git.originUrl, repoRoot });
  const paths = ensureWorkspace(fingerprint.projectId, uadsHome);
  readOrCreateProfile(paths, {
    projectId: fingerprint.projectId,
    fingerprint: fingerprint.fingerprint,
    fingerprintSource: fingerprint.source,
    repoRoot,
  });
  return { repoRoot, projectId: fingerprint.projectId, fingerprint, paths };
}

export function runInspect(input: { cwd?: string; uadsHome?: string; json?: boolean }): {
  map: RepositoryMap;
  reused: boolean;
  fullWalk: boolean;
  projectId: string;
} {
  const cwd = input.cwd ?? process.cwd();
  const ctx = projectContext(cwd, input.uadsHome);
  const inspected = inspectRepository({
    repoRoot: ctx.repoRoot,
    projectId: ctx.projectId,
    paths: ctx.paths,
    schemaRoot: findPackageRoot(),
  });
  return { ...inspected, projectId: ctx.projectId };
}

export type PlanResult = {
  workOrder: WorkOrder;
  decision: RoutingDecision;
  checkpoint: Checkpoint;
  contextPlan: ContextPlan;
  map: RepositoryMap;
  mapReused: boolean;
};

export function runPlan(input: {
  cwd?: string;
  uadsHome?: string;
  request?: string;
  intake?: unknown;
  intakePath?: string;
}): PlanResult {
  const cwd = input.cwd ?? process.cwd();
  const schemaRoot = findPackageRoot();
  const intake: NormalizedIntake = input.intake
    ? normalizeIntake(input.intake, schemaRoot)
    : intakeFromRequest(input.request ?? "");
  const ctx = projectContext(cwd, input.uadsHome);
  const inspected = inspectRepository({
    repoRoot: ctx.repoRoot,
    projectId: ctx.projectId,
    paths: ctx.paths,
    schemaRoot,
  });
  return planFromIntake({
    intake,
    map: inspected.map,
    mapReused: inspected.reused,
    projectId: ctx.projectId,
    paths: ctx.paths,
    schemaRoot,
  });
}

export function planFromIntake(input: {
  intake: NormalizedIntake;
  map: RepositoryMap;
  mapReused: boolean;
  projectId: string;
  paths: UadsPaths;
  schemaRoot?: string;
}): PlanResult {
  const now = new Date().toISOString();
  const scope = classifyScopeSize(input.intake);
  const risk = classifyRisk(input.intake, input.map);
  const domains = selectDomains(input.intake);
  const domainIds = domains.map((item) => item.id);
  const specialists = selectSpecialists({
    intake: input.intake,
    domains: domainIds,
    scopeClass: scope.scopeClass,
    risk: risk.level,
  });
  assertIndependentReview(specialists.specialists, specialists.assurance);
  const gates = selectGates({
    domains: domainIds,
    risk: risk.level,
    scopeClass: scope.scopeClass,
    intake: input.intake,
  });
  const context = selectContextRadius(scope.scopeClass, risk.level);
  const capabilityClass = selectCapabilityClass(risk.level, scope.scopeClass);
  const budget = TOKEN_BUDGETS[capabilityClass];
  const boundary = autonomyBoundary(input.intake);
  const material = `${input.projectId}:${input.intake.objective}:${now}`;
  const routingDecisionId = newPrefixedId("rd", material);
  const workOrderId = newPrefixedId("wo", material);
  const checkpointId = newPrefixedId("cp", material);

  const scoped = classifyRequestedWork({
    objective: input.intake.objective,
    inScope: scope.included,
    outOfScope: scope.outOfScope,
    recommendations: scope.recommendations,
  });
  const warnings: string[] = [];
  if (input.intake.classifier === "fallback-text") {
    warnings.push("intake used conservative fallback-text classifier, not host semantic interpretation");
  }
  if (context.radius === "C5") {
    warnings.push("C5 is exceptional and was not expected as default");
  }

  const decision: RoutingDecision = {
    schema: "uads.routing-decision",
    schemaVersion: "0.2.0",
    routingDecisionId,
    projectId: input.projectId,
    createdAt: now,
    scopeClass: scope.scopeClass,
    scopeReasons: scope.reasons,
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    domains,
    specialists: specialists.specialists,
    assuranceSpecialists: specialists.assurance,
    gates,
    contextRadius: context.radius,
    contextReason: context.reason,
    capabilityClass,
    orderConstraints: [
      "inspect before edit",
      "implement only NECESSARY scope",
      `${IMPLEMENTER_ROLE} is not the sole final reviewer`,
    ],
    stopConditions: [
      "missing required evidence",
      "approval-gated action requested",
      "hard token budget exceeded",
    ],
    warnings,
  };

  const nextAction =
    "Execute only NECESSARY scope with selected specialists, collect required evidence, then independent review.";

  const workOrder: WorkOrder = {
    schema: "uads.work-order",
    schemaVersion: "0.2.0",
    workOrderId,
    projectId: input.projectId,
    title: titleFromObjective(input.intake.objective),
    objective: input.intake.objective,
    status: "planned",
    createdAt: now,
    updatedAt: now,
    intakeRef: `intake:${sha256Hex(input.intake.objective).slice(0, 12)}`,
    routingDecisionId,
    scopeClass: scope.scopeClass,
    includedScope: scoped.necessary,
    outOfScope: scope.outOfScope,
    recommendations: scope.recommendations,
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    domains: domainIds,
    affectedAreas: input.intake.affectedAreas,
    specialists: specialists.specialists,
    assuranceReviewers: specialists.assurance,
    qualityGates: gates.map((gate) => gate.id),
    contextRadius: context.radius,
    tokenBudget: {
      ...budget,
      capabilityClass,
      cachePreference: input.mapReused ? "prefer-cache" : "refresh",
      expansionPolicy: "expand one radius level only when evidence shows missing context",
    },
    dependencies: decision.orderConstraints,
    acceptanceCriteria:
      input.intake.acceptanceCriteria.length > 0
        ? input.intake.acceptanceCriteria
        : ["Requested objective is met", "Selected gates have evidence", "Independent review completed if implementation occurred"],
    requiredEvidence: gates.map((gate) => gateEvidence(gate.id)),
    stopConditions: decision.stopConditions,
    autonomyBoundary: boundary,
    nextAction,
  };

  const contextPlan: ContextPlan = {
    radius: context.radius,
    reason: context.reason,
    candidateAreas: selectContextCandidates({
      radius: context.radius,
      intake: input.intake,
      map: input.map,
    }),
    reusableArtifacts: [
      "sidecar://index/repository-map.json",
      "sidecar://state/current.json",
      `sidecar://decisions/${routingDecisionId}.json`,
    ],
  };

  const checkpoint: Checkpoint = {
    schema: "uads.checkpoint",
    schemaVersion: "0.2.0",
    checkpointId,
    projectId: input.projectId,
    workOrderId,
    routingDecisionId,
    createdAt: now,
    updatedAt: now,
    phase: "plan",
    status: "in_progress",
    completedSteps: ["intake", "classify", "plan"],
    nextAction,
    blockers: [],
    evidenceRefs: [],
    repositoryMapDigest: input.map.digest,
    contextPlanRef: "sidecar://context/plan.json",
    resumeCursor: "plan-complete:await-implementation",
  };

  const persisted = persistPlan({
    paths: input.paths,
    workOrder,
    decision,
    checkpoint,
    contextPlan,
    schemaRoot: input.schemaRoot,
  });

  return {
    workOrder: persisted.workOrder,
    decision: persisted.decision,
    checkpoint: persisted.checkpoint,
    contextPlan: persisted.contextPlan,
    map: input.map,
    mapReused: input.mapReused,
  };
}

export function runResume(input: { cwd?: string; uadsHome?: string }): ResumePacket {
  const cwd = input.cwd ?? process.cwd();
  const ctx = projectContext(cwd, input.uadsHome);
  const state = inspectCurrentState(ctx.paths);
  if (!state.valid) {
    const recovered = readCurrentCheckpoint(ctx.paths);
    return {
      projectId: ctx.projectId,
      workOrderId: recovered?.workOrderId ?? null,
      phase: recovered?.phase ?? null,
      status: "invalid-state",
      objective: null,
      completedSteps: recovered?.completedSteps ?? [],
      scopeClass: null,
      riskLevel: null,
      specialists: [],
      gates: [],
      repositoryMapDigest: recovered?.repositoryMapDigest ?? null,
      contextPlanRef: recovered?.contextPlanRef ?? null,
      evidenceRefs: recovered?.evidenceRefs ?? [],
      blockers: [`invalid current checkpoint: ${state.error}`],
      nextAction: "Do not guess. Restore or recreate a valid plan from structured intake.",
      invalidState: state.error,
    };
  }

  const checkpoint = readCurrentCheckpoint(ctx.paths);
  if (!checkpoint || !checkpoint.workOrderId) {
    return {
      projectId: ctx.projectId,
      workOrderId: null,
      phase: checkpoint?.phase ?? null,
      status: checkpoint?.status ?? "none",
      objective: null,
      completedSteps: checkpoint?.completedSteps ?? [],
      scopeClass: null,
      riskLevel: null,
      specialists: [],
      gates: [],
      repositoryMapDigest: checkpoint?.repositoryMapDigest ?? null,
      contextPlanRef: checkpoint?.contextPlanRef ?? null,
      evidenceRefs: checkpoint?.evidenceRefs ?? [],
      blockers: [],
      nextAction: "No Work Order exists. Run uads plan --intake <file> or uads plan --request \"...\".",
    };
  }

  const workOrder = readWorkOrder(ctx.paths, checkpoint.workOrderId);
  const decision = checkpoint.routingDecisionId
    ? readRoutingDecision(ctx.paths, checkpoint.routingDecisionId)
    : null;
  return {
    projectId: ctx.projectId,
    workOrderId: checkpoint.workOrderId,
    phase: checkpoint.phase,
    status: checkpoint.status,
    objective: workOrder?.objective ?? null,
    completedSteps: checkpoint.completedSteps,
    scopeClass: workOrder?.scopeClass ?? decision?.scopeClass ?? null,
    riskLevel: workOrder?.riskLevel ?? decision?.riskLevel ?? null,
    specialists: workOrder?.specialists ?? decision?.specialists ?? [],
    gates: workOrder?.qualityGates ?? decision?.gates.map((gate) => gate.id) ?? [],
    repositoryMapDigest: checkpoint.repositoryMapDigest,
    contextPlanRef: checkpoint.contextPlanRef,
    evidenceRefs: checkpoint.evidenceRefs,
    blockers: checkpoint.blockers,
    nextAction: checkpoint.nextAction,
  };
}
