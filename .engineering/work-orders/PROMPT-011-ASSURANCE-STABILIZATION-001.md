# Work Order — `PROMPT-011-ASSURANCE-STABILIZATION-001`

Status: `ACTIVE`
Repository: `KayzenRoot/uads`
Branch: `feat/prompt-011-assurance-stabilization-001`
Baseline Git SHA: `2cd8fde252737f31a24cd5b13ed766675fd40d3f`
Head Git SHA: `pending`
Scope class: `cross-cutting`
Risk: `HIGH`

## Objective

Harden assurance integrity, add deterministic assurance and adversarial fault-injection evaluations, prove bounded Linux/Windows compatibility, and remove the explicitly identified release-documentation drift required for UADS v0.11.0 readiness without introducing provider calls, project-local runtime state, or Prompt 012 scope.

## Included scope

- Deterministic central assurance policy and semantic revalidation at assurance record/finalize seams.
- Exact recognized reviewer roles, role-to-gate separation, current-digest/evidence binding, finding coherence, and session independence.
- Bounded privacy-safe assurance packet fields and compatible review-record reason codes.
- AS1-AS16 assurance evals and FI1-FI16 deterministic fault-injection evals using isolated temporary fixtures only.
- Linux/Windows Node 20 compatibility job family for release-critical CLI, install, adapter-root, ZPF, and review/privacy checks.
- CI receipt, GitHub Direct Review, release validation, and release-title bindings for the new gates.
- Required README, quality/security/performance/DoD/backlog/Direct Review documentation updates and the 0.11.0 changelog entry after validation.
- Coherent version metadata and release artifacts only after all local and exact-SHA external gates are proven.

## Explicitly out of scope

- Prompt 012 or v1.0 closure.
- Provider API clients, model-invocation gateway, dashboard/control plane, marketplace, enterprise policy server, deep UGAS integration, deployment automation, wallet custody, or financial execution.
- macOS as a required release platform.
- Arbitrary external commands for probing reviewers or runtimes.
- Dependency upgrades, migrations, broad cleanup, historical tag movement, branch-protection changes, or enabling external GitHub security settings.
- Publishing a misleading release when exact-SHA Linux/Windows, Direct Review, CodeQL, Scorecard, or release evidence is unavailable.

## Dependencies and assumptions

- Prompt 010 baseline is represented by main SHA `0936f818ba8dc938b1b2ad41ffab0450c8fb30eb`; this worktree also contains the approved governed-delivery adoption at `2cd8fde252737f31a24cd5b13ed766675fd40d3f`.
- Node.js 20 and npm are available locally and in GitHub Actions.
- GitHub Actions, CodeQL, Scorecard, and Direct Review results must be observed from exact SHA; no result may be fabricated.
- Independent review remains a required maintainer action; the implementer cannot self-approve or promote canonical truth.

## Acceptance criteria

- [x] Central assurance policy exists with stable reason codes and exact role/gate semantics.
- [x] APPROVED with HIGH/CRITICAL findings, stale/corrupt/mismatched evidence, current FAIL/BLOCKED evidence, cross-role approval, duplicate-session counterfeit, and implementer self-approval all fail closed.
- [x] Finalize independently revalidates current assurance and specialist-selection identity.
- [x] Privacy-safe bounded assurance packet is persisted sidecar-first.
- [x] `npm run eval:assurance` passes at least AS1-AS16.
- [x] `npm run eval:fault-injection` passes at least FI1-FI16 and every case proves blocking behavior.
- [x] All legacy tests/evals and validation counts remain green or are increased with a documented reason.
- [ ] Linux + Windows Node 20 compatibility evidence is bound to exact SHA and cannot be absent while represented as PASS.
- [x] README release drift and release-title single source are corrected without a manual-version trap.
- [ ] v0.11.0 metadata/release is created only from the final exact SHA after local and external evidence is complete.

## Required gates and evidence

- Gates: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, all legacy evals, `npm run eval:assurance`, `npm run eval:fault-injection`, `npm run validate:skills`, `npm run validate`, `npm audit --audit-level=high`, `npm pack --dry-run`, exact-SHA compatibility, CodeQL, Scorecard, Direct Review, and release validation.
- Evidence: bounded command outputs, focused tests, privacy assertions, exact-SHA CI/compatibility receipts, Direct Review evidence, release manifest/checksums/SBOM, and an independent review.

## Stop conditions

- Any v0.10.4 invariant or prior eval count regresses without a justified replacement.
- Assurance can approve unresolved HIGH/CRITICAL findings, current FAIL/BLOCKED evidence is bypassed, reviewer independence weakens, or security/performance/reliability roles cross-satisfy.
- Any FI case fails to block, ZPF/privacy is violated, secrets/absolute paths enter durable evidence, provider/network behavior is introduced, historical tags would move, or a destructive external action is required.
- Exact-SHA Linux/Windows compatibility or required GitHub evidence is missing or red.

## Autonomy boundary

- Safe autonomous actions: inspect, create the bounded branch and records, edit in-scope source/tests/docs/workflows, run isolated local validation, commit, push the focused branch, and open/update a review request.
- Requires maintainer/owner action: independent approval, promotion of checkpoint/canonical truth, merge to `main`, enabling repository security settings, and publishing v0.11.0 if any required external evidence is not independently satisfied.

## Review and delivery

- Independent reviewer: `independent-reviewer` plus required role-specific assurance reviewers.
- PR title: `feat: harden assurance and adversarial stabilization`
- Evidence Bundle: `.engineering/reports/EVIDENCE-BUNDLE-PROMPT-011-ASSURANCE-STABILIZATION-001.md`
- Checkpoint Delta: `.engineering/checkpoints/CHECKPOINT-DELTA-PROMPT-011-ASSURANCE-STABILIZATION-001.md`
