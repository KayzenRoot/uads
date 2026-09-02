import fs from "node:fs";
import path from "node:path";
import { atomicWriteJson, readJsonIfValid } from "../lib/atomic-write.js";
import { isPathInside } from "../lib/hash.js";
import { assertSchema } from "../lib/json-schema.js";
import { sanitizeOperationalValue } from "../lib/safe-persist.js";
import type { UadsPaths } from "../lib/workspace.js";
import { isSpecialistSelectionPlanCurrent } from "./specialist-router.js";
import { loadSpecialistRegistry } from "./specialist-registry.js";
import type { SpecialistRegistry, SpecialistRoutingInput, SpecialistSelectionPlan } from "./specialist-types.js";

export class SpecialistSelectionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpecialistSelectionPersistenceError";
  }
}

function assertSafePath(root: string, target: string): void {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  if (!isPathInside(resolvedRoot, resolvedTarget)) throw new SpecialistSelectionPersistenceError("specialist selection path escape rejected");
  let current = resolvedRoot;
  for (const segment of path.relative(resolvedRoot, resolvedTarget).split(path.sep)) {
    if (!segment) continue;
    current = path.join(current, segment);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new SpecialistSelectionPersistenceError("specialist selection symlink escape rejected");
  }
}

function validatePlan(plan: SpecialistSelectionPlan, schemaRoot?: string): SpecialistSelectionPlan {
  try {
    assertSchema("specialist-selection-plan.schema.json", plan, schemaRoot);
  } catch (error) {
    throw new SpecialistSelectionPersistenceError(error instanceof Error ? error.message : String(error));
  }
  return plan;
}

export function persistSpecialistSelectionPlan(
  paths: UadsPaths,
  plan: SpecialistSelectionPlan,
  schemaRoot?: string,
): SpecialistSelectionPlan {
  const validated = validatePlan(plan, schemaRoot);
  assertSafePath(paths.home, paths.currentSpecialistSelection);
  assertSafePath(paths.home, paths.specialistSelectionHistory);
  fs.mkdirSync(paths.specialistSelectionHistory, { recursive: true });
  const safePlan = sanitizeOperationalValue(validated);
  atomicWriteJson(paths.currentSpecialistSelection, safePlan);
  atomicWriteJson(path.join(paths.specialistSelectionHistory, `${plan.selectionPlanId}.json`), safePlan);
  return validated;
}

export function readCurrentSpecialistSelectionPlan(paths: UadsPaths, schemaRoot?: string): SpecialistSelectionPlan | null {
  if (!fs.existsSync(paths.currentSpecialistSelection)) return null;
  assertSafePath(paths.home, paths.currentSpecialistSelection);
  const parsed = readJsonIfValid<SpecialistSelectionPlan>(paths.currentSpecialistSelection);
  if (!parsed.ok) throw new SpecialistSelectionPersistenceError("current specialist selection is corrupt");
  return validatePlan(parsed.value, schemaRoot);
}

export function assertCurrentSpecialistSelection(
  paths: UadsPaths,
  plan: SpecialistSelectionPlan,
  input: SpecialistRoutingInput,
  schemaRoot?: string,
): void {
  if (plan.status !== "SELECTED") throw new SpecialistSelectionPersistenceError(`specialist selection is blocked: ${plan.blockedReasonCodes.join(", ")}`);
  if (!isSpecialistSelectionPlanCurrent(plan, input)) throw new SpecialistSelectionPersistenceError("specialist selection is stale or bound to different project/routing inputs");
  validatePlan(plan, schemaRoot);
}

export function assertSpecialistSelectionBoundToWorkOrder(
  paths: UadsPaths,
  workOrder: {
    projectId: string;
    workOrderId: string;
    specialistSelectionPlanId?: string;
    specialistSelectionDigest?: string;
    specialistRegistryDigest?: string;
    specialistPolicyDigest?: string;
  },
  schemaRoot?: string,
): SpecialistSelectionPlan {
  const plan = readCurrentSpecialistSelectionPlan(paths, schemaRoot);
  if (!plan) throw new SpecialistSelectionPersistenceError("current specialist selection is missing");
  if (plan.status !== "SELECTED") throw new SpecialistSelectionPersistenceError(`specialist selection is blocked: ${plan.blockedReasonCodes.join(", ")}`);
  if (
    plan.projectId !== workOrder.projectId ||
    plan.workOrderId !== workOrder.workOrderId ||
    plan.selectionPlanId !== workOrder.specialistSelectionPlanId ||
    plan.selectionDigest !== workOrder.specialistSelectionDigest ||
    plan.registryDigest !== workOrder.specialistRegistryDigest ||
    plan.policyDigest !== workOrder.specialistPolicyDigest
  ) {
    throw new SpecialistSelectionPersistenceError("specialist selection is stale or not bound to the Work Order");
  }
  const registry = loadSpecialistRegistry(paths, schemaRoot);
  if (registry.registryDigest !== plan.registryDigest) throw new SpecialistSelectionPersistenceError("specialist registry changed after selection");
  return plan;
}

export function specialistRoutingInputFromWorkOrder(
  workOrder: {
    projectId: string;
    workOrderId: string;
    objective: string;
    includedScope: string[];
    outOfScope: string[];
    acceptanceCriteria: string[];
    domains: string[];
    scopeClass: SpecialistRoutingInput["scopeClass"];
    riskLevel: SpecialistRoutingInput["riskLevel"];
    riskReasons: string[];
    affectedAreas: string[];
    qualityGates: string[];
    requiredEvidence: string[];
    dependencies: string[];
    specialistRegistryDigest?: string;
    specialistPolicyDigest?: string;
    specialistSelectionDigest?: string;
  },
  registry: SpecialistRegistry,
): SpecialistRoutingInput {
  return {
    projectId: workOrder.projectId,
    workOrderId: workOrder.workOrderId,
    objective: workOrder.objective,
    constraints: workOrder.riskReasons,
    inScope: workOrder.includedScope,
    outOfScope: workOrder.outOfScope,
    acceptanceCriteria: workOrder.acceptanceCriteria,
    domains: workOrder.domains,
    scopeClass: workOrder.scopeClass,
    riskLevel: workOrder.riskLevel,
    riskSignals: workOrder.riskReasons,
    affectedAreas: workOrder.affectedAreas,
    gates: workOrder.qualityGates,
    requiredEvidence: workOrder.requiredEvidence,
    dependencyInfo: workOrder.dependencies,
    registry,
  };
}
