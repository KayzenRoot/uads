# Checkpoint Delta — `ENG-PROMPT-012-HOST-EXECUTION-IMPLEMENTATION-001`

Status: `PROPOSED`
Canonical promotion: `PENDING_MAINTAINER`
Work Order identity: `ENG-PROMPT-012-HOST-EXECUTION-IMPLEMENTATION-001`

## Lifecycle transition

- Before: `Prompt 012 scope freeze accepted on main c8ce23e; implementation not started`
- After proposed: `bounded Host Execution/Receipt implementation present on the exact feature branch; review pending`

## Completed steps

- Revalidated the parent scope-freeze SHA/tree and created the exact
  implementation branch from `origin/main`.
- Added the closed Host Execution Receipt schema, global sidecar paths, common
  adapter API, handoff seam, receipt state machine, CLI surface, and focused
  HEB01–HEB20 coverage.
- Applied Correction 01: receipt mutations now reconstruct current dispatch
  authority before writing, and approval-gated Work Orders fail closed with
  `APPROVAL_AUTHORIZATION_MISSING` when no durable exact-identity proof exists.
- Added HEB21–HEB27 coverage for execution/orchestration/host/bundle drift,
  unchanged transition continuity, approval rejection, and completed-receipt
  non-substitution.
- Applied Correction 02: the planner now preserves the global
  `requiresApproval` policy catalog while deriving the fixed-vocabulary
  `activeApprovalGatedActions` projection for the current requested work.
  Active classification is bound into Work Order and Host Dispatch identity;
  only a non-empty active projection blocks handoff with
  `APPROVAL_AUTHORIZATION_MISSING`.
- Removed the fixture behavior that rewrote `requiresApproval` to an empty
  array and added HEB28–HEB44 coverage for safe handoff, each active gated
  class, classification tamper, caller-boolean bypass attempts, caller-prose
  rejection, lifecycle compatibility, ambiguous sensitive intent, and
  promotion-to-production classification, and requested-artifact binding.
  Host Dispatch recomputes the active projection from all persisted canonical
  Work Order action signals.
- Applied Correction 03: the active approval corpus now includes persisted
  `constraints` and `acceptanceCriteria`, and `constraints` participates in
  the existing Work Order routing digest. Host Dispatch requires persisted
  constraints and fails closed for legacy Work Orders that lack them instead
  of treating absence as `[]` or evidence of safety.
- Added HEB45–HEB52 coverage for constraints-only and acceptance-criteria-only
  package publication, constraints-only production deployment, post-prepare
  approval-classification drift, legacy missing constraints, benign
  constraints, caller authorization bypass, and completed-receipt
  non-substitution.
- Preserved provider neutrality, global-first/ZPF behavior, existing gate and
  assurance authority, release immutability, and Architecture Freeze v0.2.
- Recorded passing local implementation evidence in the linked Evidence Bundle;
  hosted checks and independent audit remain pending until the PR head exists.

## Open items

- Local focused correction gates pass for HEB01–HEB52; HEB44 and HEB49 cover
  explicit legacy sidecar migration failures. Complete the full local matrix
  and audit the exact changed paths after the correction patch is pushed.
- Push one exact branch and open one unmerged PR with required checks.
- Obtain independent technical audit of exact PR head/tree/base.
- Maintainer must decide any canonical promotion or merge; the implementer
  cannot promote this delta or mark Prompt 012 complete.

## Safety statement

This delta does not authorize provider invocation, arbitrary command execution,
approval, merge, release, tag mutation, or canonical promotion. It records a
review-pending implementation proposal and must remain `PROPOSED` /
`PENDING_MAINTAINER` until an independent reviewer and maintainer act.
