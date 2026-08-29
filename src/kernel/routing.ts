import type { NormalizedIntake, RiskLevel, ScopeClass } from "./types.js";
import { IMPLEMENTER_ROLE, INDEPENDENT_REVIEWER_ROLE } from "./types.js";
import { unique } from "./ids.js";
import { GATE_REGISTRY } from "./gates.js";

export type SpecialistDef = {
  id: string;
  purpose: string;
  activation: string;
  domains: string[];
  mayImplement: boolean;
  reviewOnly: boolean;
  expectedInput: string;
  expectedOutput: string;
  incompatibleWith?: string[];
};

export const SPECIALISTS: SpecialistDef[] = [
  {
    id: "repo-inspector",
    purpose: "Inspect repository metadata",
    activation: "every plan",
    domains: ["general"],
    mayImplement: false,
    reviewOnly: true,
    expectedInput: "repo root + sidecar cache key",
    expectedOutput: "compact repository map",
  },
  {
    id: "requirements-engineer",
    purpose: "Normalize acceptance criteria",
    activation: "non-trivial scope",
    domains: ["requirements"],
    mayImplement: false,
    reviewOnly: true,
    expectedInput: "normalized intake",
    expectedOutput: "acceptance criteria and constraints",
  },
  {
    id: "software-architect",
    purpose: "Bound architecture decisions",
    activation: "cross-cutting or architectural scope",
    domains: ["architecture"],
    mayImplement: false,
    reviewOnly: true,
    expectedInput: "intake + repository map",
    expectedOutput: "architecture bounds",
  },
  {
    id: "implementation-planner",
    purpose: "Produce an executable plan",
    activation: "every plan",
    domains: ["general"],
    mayImplement: false,
    reviewOnly: true,
    expectedInput: "intake + routing inputs",
    expectedOutput: "Work Order draft inputs",
  },
  {
    id: "implementation-agent",
    purpose: "Apply in-scope product edits",
    activation: "planned implementation",
    domains: ["general"],
    mayImplement: true,
    reviewOnly: false,
    expectedInput: "Work Order",
    expectedOutput: "in-scope edits",
    incompatibleWith: ["independent-reviewer"],
  },
  {
    id: "test-engineer",
    purpose: "Design and run focused tests",
    activation: "non-docs non-style plans",
    domains: ["quality"],
    mayImplement: false,
    reviewOnly: true,
    expectedInput: "Work Order + gates",
    expectedOutput: "focused tests/evidence",
  },
  {
    id: "independent-reviewer",
    purpose: "Independently review implementation",
    activation: "any plan that includes implementation-agent",
    domains: ["quality"],
    mayImplement: false,
    reviewOnly: true,
    expectedInput: "diff + gates",
    expectedOutput: "independent review evidence",
    incompatibleWith: ["implementation-agent"],
  },
  {
    id: "security-reviewer",
    purpose: "Security assurance",
    activation: "HIGH/CRITICAL or authentication signals",
    domains: ["security"],
    mayImplement: false,
    reviewOnly: true,
    expectedInput: "auth/API/Web3 plan",
    expectedOutput: "security review evidence",
  },
  {
    id: "performance-reviewer",
    purpose: "Performance assurance",
    activation: "performance-hot-path or performance domain",
    domains: ["performance"],
    mayImplement: false,
    reviewOnly: true,
    expectedInput: "hot-path plan",
    expectedOutput: "performance check evidence",
  },
  {
    id: "checkpoint-manager",
    purpose: "Persist resume state",
    activation: "every plan",
    domains: ["general"],
    mayImplement: false,
    reviewOnly: true,
    expectedInput: "Work Order + routing decision",
    expectedOutput: "atomic sidecar checkpoint",
  },
];

export function selectSpecialists(input: {
  intake: NormalizedIntake;
  domains: string[];
  scopeClass: ScopeClass;
  risk: RiskLevel;
}): { specialists: string[]; assurance: string[] } {
  const specialists: string[] = ["repo-inspector", "implementation-planner", "checkpoint-manager"];
  const assurance: string[] = [];
  const docsOnly = input.domains.length > 0 && input.domains.every((id) => id === "documentation" || id === "general");
  const styleOnly =
    input.scopeClass === "trivial" &&
    input.risk === "LOW" &&
    input.domains.includes("frontend") &&
    !input.intake.riskSignals.length;

  if (input.scopeClass !== "trivial") {
    specialists.push("requirements-engineer");
  }
  if (input.scopeClass === "architectural" || input.scopeClass === "cross-cutting") {
    specialists.push("software-architect");
  }
  specialists.push("implementation-agent");
  if (!docsOnly && !styleOnly) {
    specialists.push("test-engineer");
  }
  assurance.push(INDEPENDENT_REVIEWER_ROLE);
  if (input.risk === "HIGH" || input.risk === "CRITICAL" || input.intake.riskSignals.includes("authentication")) {
    assurance.push("security-reviewer");
  }
  if (input.intake.riskSignals.includes("performance-hot-path") || input.domains.includes("performance")) {
    assurance.push("performance-reviewer");
  }

  const uniqueSpecialists = unique(specialists);
  const uniqueAssurance = unique(assurance);
  if (uniqueSpecialists.includes(IMPLEMENTER_ROLE) && uniqueAssurance.length === 0) {
    uniqueAssurance.push(INDEPENDENT_REVIEWER_ROLE);
  }
  return { specialists: uniqueSpecialists, assurance: uniqueAssurance };
}

export function assertIndependentReview(specialists: string[], assurance: string[]): void {
  if (specialists.includes(IMPLEMENTER_ROLE)) {
    const reviewers = unique([...assurance, ...specialists.filter((id) => id !== IMPLEMENTER_ROLE && id.endsWith("reviewer"))]);
    if (!reviewers.includes(INDEPENDENT_REVIEWER_ROLE) && !reviewers.includes("security-reviewer")) {
      throw new Error("implementer cannot be the sole final reviewer");
    }
  }
}

export function selectGates(input: {
  domains: string[];
  risk: RiskLevel;
  scopeClass: ScopeClass;
  intake: NormalizedIntake;
}): Array<{ id: string; reason: string }> {
  const gates: Array<{ id: string; reason: string }> = [];
  const add = (id: string, reason: string): void => {
    if (!gates.some((gate) => gate.id === id)) {
      gates.push({ id, reason });
    }
  };

  add("static", "static analysis for every planned change");
  if (input.scopeClass !== "trivial" || input.domains.includes("frontend")) {
    add("unit-test", "focused tests or smoke for the requested change");
  }
  if (input.intake.domainSignals.includes("frontend") && input.scopeClass === "trivial") {
    add("build", "build if the project convention compiles UI assets");
    return gates;
  }
  if (input.domains.includes("documentation") && input.scopeClass === "trivial") {
    return gates;
  }
  if (
    input.intake.riskSignals.includes("dependency") ||
    input.intake.riskSignals.includes("supply-chain") ||
    input.intake.domainSignals.includes("release") && input.intake.riskSignals.includes("dependency")
  ) {
    add("dependency-audit", GATE_REGISTRY.find((gate) => gate.id === "dependency-audit")?.purpose ?? "dependency/supply-chain audit");
  }
  if (input.scopeClass === "architectural") {
    add("architecture-conformance", "architectural scope requires conformance evidence");
  }
  if (input.domains.includes("release") || input.intake.domainSignals.includes("release")) {
    add("release-check", "release-domain work requires release readiness evidence");
  }
  if (input.domains.includes("api") || input.intake.riskSignals.includes("authentication")) {
    add("integration-test", "authenticated/API path needs integration coverage");
    add("contract-test", "public API/contract assertions when applicable");
    add("security-review", "auth/API change requires security review");
    add("build", "compile the service");
  }
  if (input.intake.riskSignals.includes("database-migration") || input.domains.includes("database")) {
    add("database-migration", "migration test for schema change");
    add("rollback-validation", "rollback/integrity validation");
  }
  if (input.domains.includes("web3") || input.domains.includes("smart-contracts")) {
    add("web3-unit", "contract unit tests");
    add("web3-fuzz", "fuzz public contract paths");
    add("web3-invariant", "invariant checks for vault/fund accounting");
    add("security-review", "independent security review");
  }
  if (input.intake.riskSignals.includes("financial-calculation") || input.domains.includes("finance-economics")) {
    add("financial-numerical-validation", "numerical/edge-case validation");
  }
  if (input.domains.includes("mathematics-simulation") || input.domains.includes("game-systems")) {
    add("simulation-invariant", "simulation/invariant validation");
  }
  if (input.intake.riskSignals.includes("performance-hot-path") || input.domains.includes("performance")) {
    add("performance-check", "hot-path regression check");
  }
  if (input.risk === "HIGH" || input.risk === "CRITICAL") {
    add("security-review", "high/critical plans require security assurance");
  }
  return gates;
}

export function autonomyBoundary(intake: NormalizedIntake): {
  safeAutonomous: string[];
  requiresApproval: string[];
} {
  const requiresApproval: string[] = [];
  if (intake.destructiveSignals.length > 0 || intake.riskSignals.includes("destructive")) {
    requiresApproval.push("destructive production database operation");
  }
  if (intake.domainSignals.includes("web3") || intake.riskSignals.includes("web3")) {
    requiresApproval.push("transferring assets/funds");
    requiresApproval.push("on-chain transaction execution");
  }
  if (intake.riskSignals.includes("infrastructure")) {
    requiresApproval.push("production deployment");
    requiresApproval.push("changing external infrastructure with material cost/availability impact");
  }
  return {
    safeAutonomous: [
      "repository reads",
      "local code edits",
      "local tests",
      "lint/typecheck/build",
      "review-bundle generation",
      "non-destructive Git inspection",
      "normal commits/pushes in an authorized workflow",
    ],
    requiresApproval: unique([
      ...requiresApproval,
      "production deployment",
      "spending money",
      "rotating real credentials",
      "destructive Git history rewrite",
      "publishing packages/releases when not already authorized",
    ]),
  };
}
