import { sha256Hex } from "../lib/hash.js";
import { DOMAIN_IDS, type DomainId } from "./domains.js";
import {
  computeSpecialistRegistryDigest,
  normalizeSpecialistProfile,
} from "./specialist-registry.js";
import type {
  SpecialistAssignment,
  SpecialistProfile,
  SpecialistRegistry,
  SpecialistRoutingInput,
  SpecialistSelection,
  SpecialistSelectionPlan,
} from "./specialist-types.js";
import { SPECIALIST_POLICY_VERSION } from "./specialist-types.js";

export const SPECIALIST_POLICY = {
  schema: "uads.specialist-routing-policy",
  policyVersion: "0.9.0",
  maxProfiles: 64,
  maxSelected: 32,
  algorithm: "bounded-deterministic-greedy",
  mandatoryCoreOrder: [
    "repo-inspector",
    "implementation-planner",
    "checkpoint-manager",
    "requirements-engineer",
    "software-architect",
    "implementation-agent",
    "test-engineer",
  ],
  assuranceOrder: [
    "independent-reviewer",
    "security-reviewer",
    "performance-reviewer",
    "reliability-reviewer",
  ],
  forbiddenParallelPairs: [
    ["implementation-agent", "independent-reviewer"],
    ["implementation-agent", "security-reviewer"],
    ["implementation-agent", "performance-reviewer"],
    ["implementation-agent", "reliability-reviewer"],
  ],
} as const;

export const SPECIALIST_POLICY_DIGEST = sha256Hex(JSON.stringify(SPECIALIST_POLICY));

const KNOWN_DOMAINS = new Set<string>(DOMAIN_IDS);
const RISK_ORDER = new Map(["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value, index) => [value, index]));
const REASON = {
  CORE_REQUIRED: "CORE_REQUIRED",
  DOMAIN_COVERAGE: "DOMAIN_COVERAGE",
  ARCHITECTURE_SCOPE: "ARCHITECTURE_SCOPE",
  RISK_ASSURANCE: "RISK_ASSURANCE",
  GATE_REQUIRES_SPECIALIST: "GATE_REQUIRES_SPECIALIST",
  AFFECTED_AREA_MATCH: "AFFECTED_AREA_MATCH",
  DEPENDENCY_CROSS_CUTTING: "DEPENDENCY_CROSS_CUTTING",
  INDEPENDENT_REVIEW_REQUIRED: "INDEPENDENT_REVIEW_REQUIRED",
  SECURITY_ASSURANCE_REQUIRED: "SECURITY_ASSURANCE_REQUIRED",
  PERFORMANCE_ASSURANCE_REQUIRED: "PERFORMANCE_ASSURANCE_REQUIRED",
  RELIABILITY_ASSURANCE_REQUIRED: "RELIABILITY_ASSURANCE_REQUIRED",
  RELEASE_ASSURANCE_REQUIRED: "RELEASE_ASSURANCE_REQUIRED",
  MINIMUM_SUFFICIENT_SET: "MINIMUM_SUFFICIENT_SET",
  SPECIALIST_DISABLED: "SPECIALIST_DISABLED",
  SPECIALIST_EXPERIMENTAL_NOT_ALLOWED: "SPECIALIST_EXPERIMENTAL_NOT_ALLOWED",
  SPECIALIST_CONFLICT: "SPECIALIST_CONFLICT",
  NO_DOMAIN_COVERAGE: "NO_DOMAIN_COVERAGE",
  NO_ASSURANCE_COVERAGE: "NO_ASSURANCE_COVERAGE",
  UNMET_REQUIRED_EVIDENCE: "UNMET_REQUIRED_EVIDENCE",
} as const;

function sortedUnique(values: string[]): string[] {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0))].sort((a, b) => a.localeCompare(b));
}

function canonicalInput(input: SpecialistRoutingInput): Record<string, unknown> {
  return {
    projectId: input.projectId,
    objective: input.objective,
    constraints: sortedUnique(input.constraints),
    inScope: sortedUnique(input.inScope),
    outOfScope: sortedUnique(input.outOfScope),
    acceptanceCriteria: sortedUnique(input.acceptanceCriteria),
    domains: sortedUnique(input.domains),
    scopeClass: input.scopeClass,
    riskLevel: input.riskLevel,
    riskSignals: sortedUnique(input.riskSignals),
    affectedAreas: sortedUnique(input.affectedAreas),
    gates: sortedUnique(input.gates),
    requiredEvidence: sortedUnique(input.requiredEvidence),
    dependencyInfo: sortedUnique(input.dependencyInfo ?? []),
    changeDigest: input.changeDigest ?? null,
    impactDigest: input.impactDigest ?? null,
    gateContractDigest: input.gateContractDigest ?? null,
  };
}

export function computeSpecialistRoutingDigest(input: SpecialistRoutingInput): string {
  return sha256Hex(JSON.stringify(canonicalInput(input)));
}

export function computeSpecialistWorkOrderDigest(input: Pick<SpecialistRoutingInput, "objective" | "constraints" | "inScope" | "outOfScope" | "acceptanceCriteria" | "requiredEvidence" | "dependencyInfo">): string {
  return sha256Hex(JSON.stringify({
    objective: input.objective,
    constraints: sortedUnique(input.constraints),
    inScope: sortedUnique(input.inScope),
    outOfScope: sortedUnique(input.outOfScope),
    acceptanceCriteria: sortedUnique(input.acceptanceCriteria),
    requiredEvidence: sortedUnique(input.requiredEvidence),
    dependencyInfo: sortedUnique(input.dependencyInfo ?? []),
  }));
}

function riskAtLeast(actual: SpecialistRoutingInput["riskLevel"], minimum: SpecialistRoutingInput["riskLevel"]): boolean {
  return (RISK_ORDER.get(actual) ?? 0) >= (RISK_ORDER.get(minimum) ?? 0);
}

function activationMatches(profile: SpecialistProfile, input: SpecialistRoutingInput): boolean {
  const activation = profile.activation;
  if (activation.scopeClasses && !activation.scopeClasses.includes(input.scopeClass)) return false;
  if (activation.minRisk && !riskAtLeast(input.riskLevel, activation.minRisk)) return false;
  const domainMatch = activation.domainAny?.some((domain) => input.domains.includes(domain));
  const riskSignalMatch = activation.riskSignalsAny?.some((signal) => input.riskSignals.includes(signal));
  const gateMatch = activation.gatesAny?.some((gate) => input.gates.includes(gate));
  const areaMatch = activation.affectedAreaAny?.some((area) => input.affectedAreas.includes(area));
  const constrained = [activation.domainAny, activation.riskSignalsAny, activation.gatesAny, activation.affectedAreaAny].some(Boolean);
  return !constrained || Boolean(domainMatch || riskSignalMatch || gateMatch || areaMatch);
}

function operationalEligible(profile: SpecialistProfile, input: SpecialistRoutingInput): { ok: boolean; reason?: string } {
  if (profile.status === "disabled") return { ok: false, reason: REASON.SPECIALIST_DISABLED };
  if (profile.status === "experimental" && !input.allowExperimental) return { ok: false, reason: REASON.SPECIALIST_EXPERIMENTAL_NOT_ALLOWED };
  if (!activationMatches(profile, input)) return { ok: false, reason: REASON.MINIMUM_SUFFICIENT_SET };
  return { ok: true };
}

function profileMap(registry: SpecialistRegistry): Map<string, SpecialistProfile> {
  return new Map(registry.profiles.map((profile) => [profile.specialistId, profile]));
}

function selectionOf(profile: SpecialistProfile, required: boolean, reasonCodes: string[], gates: string[], domains: string[]): SpecialistSelection {
  return {
    specialistId: profile.specialistId,
    kind: profile.kind,
    role: profile.purpose,
    required,
    reasonCodes: sortedUnique(reasonCodes),
    coversDomains: sortedUnique([...profile.coveredDomains, ...domains]) as DomainId[],
    coversGates: sortedUnique(gates),
    independenceClass: profile.independenceClass,
  };
}

function isImplementationLike(profile: SpecialistProfile): boolean {
  return profile.mayImplement || profile.functions.includes("implementation");
}

function requestedDomains(input: SpecialistRoutingInput): string[] {
  return sortedUnique(input.domains).filter((domain) => !["general", "architecture", "quality", "security", "performance", "reliability"].includes(domain));
}

function hasAny(input: SpecialistRoutingInput, values: string[]): boolean {
  return values.some((value) => input.domains.includes(value) || input.riskSignals.includes(value) || input.gates.includes(value));
}

function addSelection(
  selected: SpecialistSelection[],
  profile: SpecialistProfile,
  required: boolean,
  reasons: string[],
  input: SpecialistRoutingInput,
): void {
  if (!selected.some((item) => item.specialistId === profile.specialistId)) {
    selected.push(selectionOf(profile, required, reasons, input.gates, profile.coveredDomains));
  }
}

function addAssurance(
  assurance: SpecialistSelection[],
  profile: SpecialistProfile,
  reasons: string[],
  input: SpecialistRoutingInput,
): void {
  if (!assurance.some((item) => item.specialistId === profile.specialistId)) {
    assurance.push(selectionOf(profile, true, reasons, input.gates, profile.coveredDomains));
  }
}

function buildAssignments(
  selections: SpecialistSelection[],
  profiles: Map<string, SpecialistProfile>,
  input: SpecialistRoutingInput,
  assurance: Set<string>,
): SpecialistAssignment[] {
  return selections.map((selection, index) => {
    const profile = profiles.get(selection.specialistId);
    if (!profile) throw new Error(`missing selected specialist profile: ${selection.specialistId}`);
    const relevantAffectedAreas = profile.activation.affectedAreaAny?.length
      ? sortedUnique(profile.activation.affectedAreaAny.filter((area) => input.affectedAreas.includes(area)))
      : sortedUnique(input.affectedAreas);
    const relevantFiles = sortedUnique(input.affectedAreas.filter((area) => !area.includes(":" ) && !area.startsWith("sidecar://") && !area.startsWith("http")));
    const isAssurance = assurance.has(profile.specialistId) || profile.independenceClass === "independent-review" || profile.independenceClass === "assurance";
    const dependencyGroup = isAssurance ? 5 : profile.mayImplement ? 4 : profile.kind === "domain" ? 2 : profile.functions.includes("testing") ? 3 : profile.functions.includes("planning") || profile.functions.includes("architecture") ? 2 : 1;
    return {
      specialistId: profile.specialistId,
      role: profile.purpose,
      objective: input.objective,
      coveredDomains: sortedUnique(profile.coveredDomains) as DomainId[],
      relevantAffectedAreas,
      relevantFiles,
      relevantGates: sortedUnique(input.gates),
      evidenceObligations: sortedUnique(profile.producesEvidence),
      riskLevel: input.riskLevel,
      forbiddenScope: sortedUnique([
        "out-of-scope work",
        ...input.outOfScope,
        ...(isAssurance ? ["implementing product changes", "approving without independent evidence"] : []),
        ...(profile.notes ? [profile.notes] : []),
      ]),
      dependencyGroup,
      parallelEligible: !isAssurance && !profile.mayImplement && profile.kind === "domain" && dependencyGroup === 2,
    };
  }).sort((a, b) => a.specialistId.localeCompare(b.specialistId) || a.dependencyGroup - b.dependencyGroup);
}

function assertRegistryBinding(registry: SpecialistRegistry): void {
  if (registry.policyVersion !== SPECIALIST_POLICY_VERSION) throw new Error("specialist registry policy version mismatch");
  const recalculated = computeSpecialistRegistryDigest(registry.profiles);
  if (registry.registryDigest !== recalculated) throw new Error("specialist registry digest mismatch");
}

export function selectSpecialistPlan(input: SpecialistRoutingInput): SpecialistSelectionPlan {
  assertRegistryBinding(input.registry);
  const profiles = profileMap(input.registry);
  const selected: SpecialistSelection[] = [];
  const assurance: SpecialistSelection[] = [];
  const rejections: SpecialistSelectionPlan["rejections"] = [];
  const unmetCoverage: string[] = [];
  const conflicts: string[] = [];
  const knownDomains = sortedUnique(input.domains).filter((domain) => !KNOWN_DOMAINS.has(domain));
  if (knownDomains.length > 0) unmetCoverage.push(...knownDomains.map((domain) => `${REASON.NO_DOMAIN_COVERAGE}:${domain}`));

  const docsOnly = input.domains.length > 0 && input.domains.every((id) => id === "documentation" || id === "general");
  const styleOnly = input.scopeClass === "trivial" && input.riskLevel === "LOW" && input.domains.includes("frontend") && input.riskSignals.length === 0;
  const addCore = (id: string, reasons: string[]): void => {
    const profile = profiles.get(id);
    if (!profile) {
      unmetCoverage.push(`${REASON.NO_DOMAIN_COVERAGE}:${id}`);
      return;
    }
    const eligibility = operationalEligible(profile, input);
    if (!eligibility.ok) {
      rejections.push({ specialistId: id, reasonCodes: [eligibility.reason ?? REASON.MINIMUM_SUFFICIENT_SET], reasons: ["core profile is unavailable for this routing input"] });
      if (eligibility.reason === REASON.SPECIALIST_DISABLED || eligibility.reason === REASON.SPECIALIST_EXPERIMENTAL_NOT_ALLOWED) unmetCoverage.push(`${eligibility.reason}:${id}`);
      return;
    }
    addSelection(selected, profile, true, reasons, input);
  };

  addCore("repo-inspector", [REASON.CORE_REQUIRED]);
  addCore("implementation-planner", [REASON.CORE_REQUIRED]);
  addCore("checkpoint-manager", [REASON.CORE_REQUIRED]);
  if (input.scopeClass !== "trivial") addCore("requirements-engineer", [REASON.CORE_REQUIRED]);
  if (input.scopeClass === "architectural" || input.scopeClass === "cross-cutting" || input.domains.includes("architecture") || input.riskSignals.some((signal) => ["database-migration", "destructive", "infrastructure"].includes(signal))) {
    addCore("software-architect", [REASON.ARCHITECTURE_SCOPE]);
  }
  addCore("implementation-agent", [REASON.CORE_REQUIRED]);
  if (!docsOnly && !styleOnly) addCore("test-engineer", [REASON.CORE_REQUIRED]);

  const needed = requestedDomains(input);
  while (needed.some((domain) => !selected.some((item) => item.coversDomains.includes(domain as DomainId)) && !assurance.some((item) => item.coversDomains.includes(domain as DomainId)))) {
    const uncovered = needed.filter((domain) => !selected.some((item) => item.coversDomains.includes(domain as DomainId)) && !assurance.some((item) => item.coversDomains.includes(domain as DomainId)));
    const candidates = input.registry.profiles
      .filter((profile) => profile.kind === "domain")
      .map((profile) => ({ profile, eligibility: operationalEligible(profile, input), score: profile.coveredDomains.filter((domain) => uncovered.includes(domain)).length }))
      .filter((item) => item.eligibility.ok && item.score > 0)
      .sort((a, b) => b.score - a.score || a.profile.priority - b.profile.priority || a.profile.specialistId.localeCompare(b.profile.specialistId));
    const candidate = candidates[0];
    if (!candidate) {
      for (const domain of uncovered) unmetCoverage.push(`${REASON.NO_DOMAIN_COVERAGE}:${domain}`);
      break;
    }
    addSelection(selected, candidate.profile, true, [REASON.DOMAIN_COVERAGE, REASON.MINIMUM_SUFFICIENT_SET], input);
  }

  const independent = profiles.get("independent-reviewer");
  if (independent) {
    const eligibility = operationalEligible(independent, input);
    if (eligibility.ok) addAssurance(assurance, independent, [REASON.INDEPENDENT_REVIEW_REQUIRED], input);
    else unmetCoverage.push(`${eligibility.reason ?? REASON.NO_ASSURANCE_COVERAGE}:independent-reviewer`);
  } else unmetCoverage.push(`${REASON.NO_ASSURANCE_COVERAGE}:independent-reviewer`);

  const securityRequired = input.riskLevel === "HIGH" || input.riskLevel === "CRITICAL" || hasAny(input, ["security", "authentication", "web3", "smart-contracts", "wallets", "security-review"]);
  const performanceRequired = hasAny(input, ["performance", "performance-hot-path", "performance-check"]);
  const reliabilityRequired = hasAny(input, ["reliability", "database", "cloud-devops", "database-migration", "destructive", "infrastructure", "rollback-validation"]);
  const assuranceRules: Array<[string, boolean, string]> = [
    ["security-reviewer", securityRequired, securityRequired ? (REASON.SECURITY_ASSURANCE_REQUIRED) : ""],
    ["performance-reviewer", performanceRequired, REASON.PERFORMANCE_ASSURANCE_REQUIRED],
    ["reliability-reviewer", reliabilityRequired, REASON.RELIABILITY_ASSURANCE_REQUIRED],
  ];
  for (const [id, required, reason] of assuranceRules) {
    if (!required) continue;
    const profile = profiles.get(id);
    const eligibility = profile ? operationalEligible(profile, input) : { ok: false, reason: REASON.NO_ASSURANCE_COVERAGE };
    if (profile && eligibility.ok) addAssurance(assurance, profile, [REASON.RISK_ASSURANCE, reason], input);
    else unmetCoverage.push(`${eligibility.reason ?? REASON.NO_ASSURANCE_COVERAGE}:${id}`);
  }
  if (input.domains.includes("release") || input.gates.includes("release-check")) {
    const release = profiles.get("release-specialist");
    if (release && operationalEligible(release, input).ok) addSelection(selected, release, true, [REASON.RELEASE_ASSURANCE_REQUIRED, REASON.GATE_REQUIRES_SPECIALIST], input);
    else unmetCoverage.push(`${REASON.NO_DOMAIN_COVERAGE}:release`);
  }

  const allChosen = [...selected, ...assurance];
  for (const item of allChosen) {
    const profile = profiles.get(item.specialistId);
    if (!profile) continue;
    for (const incompatible of profile.incompatibleWith) {
      if (allChosen.some((other) => other.specialistId === incompatible)) {
        conflicts.push(`${REASON.SPECIALIST_CONFLICT}:${item.specialistId}:${incompatible}`);
      }
    }
  }
  for (const profile of input.registry.profiles) {
    if (allChosen.some((item) => item.specialistId === profile.specialistId)) continue;
    const eligibility = operationalEligible(profile, input);
    rejections.push({
      specialistId: profile.specialistId,
      reasonCodes: [eligibility.reason ?? REASON.MINIMUM_SUFFICIENT_SET],
      reasons: [eligibility.reason === REASON.SPECIALIST_DISABLED ? "profile is disabled" : eligibility.reason === REASON.SPECIALIST_EXPERIMENTAL_NOT_ALLOWED ? "experimental profile is not permitted" : "profile is outside the minimum sufficient set"],
    });
  }

  selected.sort((a, b) => (profiles.get(a.specialistId)?.priority ?? 0) - (profiles.get(b.specialistId)?.priority ?? 0) || a.specialistId.localeCompare(b.specialistId));
  assurance.sort((a, b) => (profiles.get(a.specialistId)?.priority ?? 0) - (profiles.get(b.specialistId)?.priority ?? 0) || a.specialistId.localeCompare(b.specialistId));
  const allSelections = [...selected, ...assurance];
  const assuranceIds = new Set(assurance.map((item) => item.specialistId));
  const assignments = buildAssignments(allSelections, profiles, input, assuranceIds);
  const groups = new Map<number, string[]>();
  for (const assignment of assignments) groups.set(assignment.dependencyGroup, [...(groups.get(assignment.dependencyGroup) ?? []), assignment.specialistId]);
  const dependencyGroups = [...groups.entries()].sort(([a], [b]) => a - b).map(([, ids]) => ids.sort((a, b) => a.localeCompare(b)));
  const parallelEligibleGroups = assignments.filter((assignment) => assignment.parallelEligible).reduce<string[][]>((groupsList, assignment) => {
    const group = groupsList.find((ids) => assignments.find((item) => item.specialistId === ids[0])?.dependencyGroup === assignment.dependencyGroup);
    if (group) group.push(assignment.specialistId); else groupsList.push([assignment.specialistId]);
    return groupsList;
  }, []).filter((ids) => ids.length > 1).map((ids) => ids.sort((a, b) => a.localeCompare(b)));
  const workOrderDigest = computeSpecialistWorkOrderDigest(input);
  const routingDigest = computeSpecialistRoutingDigest(input);
  const registryDigest = input.registry.registryDigest;
  const baseIdentity = { projectId: input.projectId, workOrderDigest, routingDigest, registryDigest, policyDigest: SPECIALIST_POLICY_DIGEST, changeDigest: input.changeDigest ?? null, impactDigest: input.impactDigest ?? null, gateContractDigest: input.gateContractDigest ?? null };
  const selectionPlanId = `sp_${sha256Hex(JSON.stringify(baseIdentity)).slice(0, 16)}`;
  const status: SpecialistSelectionPlan["status"] = unmetCoverage.length === 0 && conflicts.length === 0 ? "SELECTED" : "BLOCKED";
  const blockedReasonCodes = sortedUnique([
    ...unmetCoverage.map((item) => item.split(":", 1)[0] ?? REASON.NO_DOMAIN_COVERAGE),
    ...conflicts.map((item) => item.split(":", 1)[0] ?? REASON.SPECIALIST_CONFLICT),
    ...(input.requiredEvidence.length === 0 && status === "BLOCKED" ? [REASON.UNMET_REQUIRED_EVIDENCE] : []),
  ]);
  const planWithoutDigest = {
    schema: "uads.specialist-selection-plan" as const,
    schemaVersion: "0.9.0" as const,
    selectionPlanId,
    projectId: input.projectId,
    workOrderId: input.workOrderId,
    workOrderDigest,
    routingDigest,
    registryDigest,
    policyDigest: SPECIALIST_POLICY_DIGEST,
    changeDigest: input.changeDigest ?? null,
    impactDigest: input.impactDigest ?? null,
    gateContractDigest: input.gateContractDigest ?? null,
    selected,
    assurance,
    assignments,
    rejections,
    unmetCoverage: sortedUnique(unmetCoverage),
    conflicts: sortedUnique(conflicts),
    dispatch: { dependencyGroups, parallelEligibleGroups },
    status,
    blockedReasonCodes,
  };
  return { ...planWithoutDigest, selectionDigest: sha256Hex(JSON.stringify(planWithoutDigest)) };
}

export function isSpecialistSelectionPlanCurrent(plan: SpecialistSelectionPlan, input: SpecialistRoutingInput): boolean {
  if (plan.projectId !== input.projectId || plan.workOrderId !== input.workOrderId) return false;
  if (input.registry.policyVersion !== SPECIALIST_POLICY_VERSION) return false;
  if (plan.registryDigest !== input.registry.registryDigest || plan.policyDigest !== SPECIALIST_POLICY_DIGEST) return false;
  if (plan.workOrderDigest !== computeSpecialistWorkOrderDigest(input) || plan.routingDigest !== computeSpecialistRoutingDigest(input)) return false;
  const expectedId = `sp_${sha256Hex(JSON.stringify({ projectId: input.projectId, workOrderDigest: plan.workOrderDigest, routingDigest: plan.routingDigest, registryDigest: plan.registryDigest, policyDigest: plan.policyDigest, changeDigest: input.changeDigest ?? null, impactDigest: input.impactDigest ?? null, gateContractDigest: input.gateContractDigest ?? null })).slice(0, 16)}`;
  if (plan.selectionPlanId !== expectedId) return false;
  const { selectionDigest, ...withoutDigest } = plan;
  return selectionDigest === sha256Hex(JSON.stringify(withoutDigest));
}

export function specialistProfileFromUnknown(raw: unknown): SpecialistProfile {
  return normalizeSpecialistProfile(raw);
}
