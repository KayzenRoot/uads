# Checkpoint Delta — `PROMPT-011-ASSURANCE-STABILIZATION-001`

Status: `PROPOSED`
Canonical promotion: `PENDING_MAINTAINER`

## Lifecycle transition

- Before: `approved Prompt 010 / v0.10.4 baseline with no active Prompt 011 stabilization record`
- After proposed: `Prompt 011 assurance stabilization implemented locally; review / READY_FOR_REVIEW pending independent maintainer review`

## Completed steps

- Captured the approved working baseline at `2cd8fde252737f31a24cd5b13ed766675fd40d3f` and preserved the immutable `v0.10.4` tag target.
- Created the Prompt 011 Work Order, Context Lock, Baseline, Evidence Bundle, and Checkpoint Delta.
- Added central deterministic assurance policy enforcement at record/finalize seams with exact roles, current identity/evidence binding, fail-closed findings, role-specific obligations, and independence checks.
 - Added AS1-AS22 assurance evaluations, including typed Specialist Selection Plan obligations and findings-file path safety.
 - Replaced the Prompt 011 fault-injection surface with normative real-boundary FI1-FI16 cases and retained the former synthetic cases as FI17-FI32.
 - Closed correction blockers C1-C4: assurance no longer trusts arbitrary prose/caller booleans, normative meanings are explicit, compatibility proof is exact-SHA/artifact bound, and findings files are bounded and root-safe.
- Added review-packet and compatibility-evidence schemas, CI receipt/Direct Review integration, and the Linux/Windows Node 20 compatibility workflow.
- Added release-title/version bindings and bounded documentation updates for v0.11.0 without implementing Prompt 012 or provider/runtime gateway scope.
- Ran local typecheck/build, focused regression tests, legacy evaluations, new evaluations, action/receipt/Direct Review validators, Windows compatibility smoke, audit, and package smoke.

## Open items

- The corrected source and hosted evidence snapshot are committed at `4061946f301ff5b7ce5d3f0ddc231ab1a87cce09`; the corrected full Vitest suite completed at 47 files/329 tests with 0 failures.
- The exact-SHA hosted matrix is green for that snapshot: CI `33930026879`, CodeQL `33930026878`, compatibility `33930026912` (Linux job `101206556191`, Windows job `101206556350`), and Dependency Review `33930026983` attempt `2` (job `101229407580`).
- Dependency Review attempt 1 is historical failure evidence only: Dependency Graph was disabled; after the repository setting was enabled, attempt 2 completed successfully on the same exact SHA.
- The focused branch remains open for independent maintainer review; only then may a maintainer merge or publish v0.11.0. Scorecard, Direct Review, and release-validation evidence remain post-merge/release-chain concerns and are not claimable from this open PR.

## Safety statement

This delta proposes repository changes and evidence only. It does not promote canonical sidecar truth, self-approve the implementation, merge to `main`, alter branch/security settings, move historical tags, or publish a release.
