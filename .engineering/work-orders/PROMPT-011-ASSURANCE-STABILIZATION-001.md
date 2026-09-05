# Work Order — `PROMPT-011-ASSURANCE-STABILIZATION-001`

Status: `COMPLETED_WITH_CORRECTION_04_OPEN`
Repository: `KayzenRoot/uads`
Branch: `fix/prompt-011-release-security-proof`
Baseline Git SHA: `d5cb361274cb19f70c8bd02dd023b596b8babf13`
Head Git SHA at source/evidence snapshot: `PENDING_CORRECTION_04_COMMIT`
Scope class: `cross-cutting`
Risk: `HIGH`

## Objective

Harden assurance integrity, add deterministic assurance and adversarial fault-injection evaluations, prove bounded Linux/Windows compatibility, and remove the explicitly identified release-documentation drift required for UADS v0.11.0 readiness without introducing provider calls, project-local runtime state, or Prompt 012 scope.

### Correction 04 amendment — release security proof

Close the remaining release-authorization gap by making CodeQL, Scorecard, and Dependency Review authoritative typed proofs for corrected-release PASS. Preserve the already-published v0.11.0 evidence and release exactly, prepare the 0.11.1 contract without publishing or tagging it here, and record successful v0.11.0 promotion without rewriting the historical pre-promotion record.

## Included scope

- Deterministic central assurance policy and semantic revalidation at assurance record/finalize seams.
- Exact recognized reviewer roles, role-to-gate separation, current-digest/evidence binding, finding coherence, and session independence.
- Bounded privacy-safe assurance packet fields and compatible review-record reason codes.
- AS1-AS22 assurance evals and normative FI1-FI16 deterministic fault-injection evals using real subsystem boundaries and isolated temporary fixtures; legacy coverage is retained as FI17-FI32.
- Linux/Windows Node 20 compatibility job family for release-critical CLI, install, adapter-root, ZPF, and review/privacy checks.
- CI receipt, GitHub Direct Review, release validation, and release-title bindings for the new gates.
- Required README, quality/security/performance/DoD/backlog/Direct Review documentation updates and the 0.11.0 changelog entry after validation.
- Coherent version metadata and release artifacts only after all local and exact-SHA external gates are proven.
- Typed 0.9.0 security proofs: exact-SHA CodeQL/Scorecard and exact-SHA or same-tree PR Dependency Review, with repository, final/source SHA/tree, run/attempt, PR, URL, and digest binding.
- Independent security-proof reconstruction in Direct Review, release verification/build/publish barriers, and final release-review validation; no v0.11.0 mutation and no v0.11.1 publication in this correction.
- RG1-RG14 adversarial coverage for failed/unknown/ambiguous/mismatched/tampered security evidence and historical immutability.

## Explicitly out of scope

- Prompt 012 or v1.0 closure.
- Provider API clients, model-invocation gateway, dashboard/control plane, marketplace, enterprise policy server, deep UGAS integration, deployment automation, wallet custody, or financial execution.
- macOS as a required release platform.
- Arbitrary external commands for probing reviewers or runtimes.
- Dependency upgrades, migrations, broad cleanup, historical tag movement, or branch-protection changes beyond the bounded Correction 03 solo-maintainer governance adjustment. That adjustment may change only the impossible approval/code-owner requirements after a documented pre-flight proves that one eligible maintainer owns the repository; all other branch protections remain unchanged.
- Publishing a misleading release when exact-SHA Linux/Windows, Direct Review, CodeQL, Scorecard, or release evidence is unavailable.

## Dependencies and assumptions

- Prompt 010 baseline is represented by main SHA `0936f818ba8dc938b1b2ad41ffab0450c8fb30eb`; this worktree also contains the approved governed-delivery adoption at `2cd8fde252737f31a24cd5b13ed766675fd40d3f`.
- Node.js 20 and npm are available locally and in GitHub Actions.
- GitHub Actions, CodeQL, Scorecard, and Direct Review results must be observed from exact SHA; no result may be fabricated.
- Independent technical audit and exact-SHA evidence remain required before promotion; the implementer cannot self-approve, fabricate a GitHub APPROVE, or promote canonical truth.

## Acceptance criteria

- [x] Central assurance policy exists with stable reason codes and exact role/gate semantics.
- [x] APPROVED with HIGH/CRITICAL findings, stale/corrupt/mismatched evidence, current FAIL/BLOCKED evidence, cross-role approval, duplicate-session counterfeit, and implementer self-approval all fail closed.
- [x] Finalize independently revalidates current assurance and specialist-selection identity.
- [x] Privacy-safe bounded assurance packet is persisted sidecar-first.
- [x] `npm run eval:assurance` passes AS1-AS22, including typed-obligation and findings-file path-safety cases.
- [x] `npm run eval:fault-injection` passes normative FI1-FI16 and retained legacy FI17-FI32; each normative case exercises a real subsystem boundary and proves blocking/stop behavior.
- [x] All legacy tests/evals and validation counts remain green or are increased with a documented reason.
- [x] C1 typed assurance evidence binds to the canonical Specialist Selection Plan; arbitrary prose and caller booleans cannot satisfy assurance.
- [x] C2 normative FI meanings and real-boundary fixtures are recorded and mapped to FI1-FI16.
- [x] C3 compatibility evidence requires event-aware exact SHA/tree/run/attempt/job/platform/artifact identity, Node 20, fixed checks, and digest validation.
- [x] C4 `--findings-file` accepts only bounded ordinary JSON files under managed repository/sidecar roots and rejects traversal, symlink escape, foreign roots, invalid JSON, and oversize input without leaking paths.
- [x] C5 Dependency Graph is enabled and Dependency Review is green on exact SHA `4061946f301ff5b7ce5d3f0ddc231ab1a87cce09`: workflow run `33930026983`, attempt `2`, job `101229407580`, conclusion `success`. Attempt 1 is retained only as historical failure evidence: the graph was disabled, then enabled and successfully rerun.
- [x] README release drift and release-title single source are corrected without a manual-version trap.
- [x] v0.11.0 promotion completed on the audited exact SHA; the release/tag/assets remain immutable.
- [x] Corrected v0.11.1 semantics require all three reconstructable security proofs for final PASS.
- [x] RG1-RG14 regression tests cover failure, unknown, exact-SHA, same-tree PR, mismatch, ambiguity, tampering, all-pass, and v0.11.0 immutability cases.
- [ ] Correction 04 branch receives independent review and hosted green checks before maintainer merge; no merge, tag, or v0.11.1 release is authorized by this worktree.

## Required gates and evidence

- Gates: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, all legacy evals, `npm run eval:assurance`, `npm run eval:fault-injection`, `npm run validate:skills`, `npm run validate`, `npm audit --audit-level=high`, `npm pack --dry-run`, C1-C4 local checks, exact-SHA Linux/Windows compatibility artifacts, CodeQL, Scorecard, Direct Review, and release validation. Dependency Review must not remain red at merge/release time.
- Evidence: bounded command outputs, focused tests, privacy assertions, exact-SHA CI/compatibility receipts, Direct Review evidence, release manifest/checksums/SBOM, and an independent review.
- Correction 04 evidence additionally requires proof digests to agree across canonical Direct Review, review index, release builder, publisher, and final derivative; Scorecard must be observed only from its push-to-main workflow.

## Stop conditions

- Any v0.10.4 invariant or prior eval count regresses without a justified replacement.
- Assurance can approve unresolved HIGH/CRITICAL findings, current FAIL/BLOCKED evidence is bypassed, reviewer independence weakens, or security/performance/reliability roles cross-satisfy.
- Any FI case fails to block, ZPF/privacy is violated, secrets/absolute paths enter durable evidence, provider/network behavior is introduced, historical tags would move, or a destructive external action is required.
- Exact-SHA Linux/Windows compatibility or required GitHub evidence is missing or red; any required GitHub gate is missing or red; or C1-C4 evidence identity cannot be independently reconstructed.
- Any corrected-release security proof is missing, unknown, failed, ambiguous, source/tree mismatched, digest-tampered, or inferred from a PR Scorecard result.

## Autonomy boundary

- Safe autonomous actions: inspect, create the bounded branch and records, edit in-scope source/tests/docs/workflows, apply the documented solo-maintainer protection adjustment after pre-flight, run isolated local validation, commit, push the focused branch, and open/update a review request.
- Requires maintainer/owner action: independent review and merge of Correction 04, restoration of multi-maintainer review requirements when a second eligible maintainer exists, and any future v0.11.1 tag/release after fresh post-merge external proof. This implementation does not merge, tag, or publish.

## Review and delivery

- Independent technical audit: recorded on PR #12 as comment/review evidence `5119401125`; GitHub human APPROVE is intentionally not required in current solo-maintainer mode.
- Historical PR #12 title: `feat: harden assurance and adversarial stabilization` (promotion completed and retained as history).
- Correction 04 PR title: `fix: bind release authorization to security proof`
- Evidence Bundle: `.engineering/reports/EVIDENCE-BUNDLE-PROMPT-011-ASSURANCE-STABILIZATION-001.md`
- Checkpoint Delta: `.engineering/checkpoints/CHECKPOINT-DELTA-PROMPT-011-ASSURANCE-STABILIZATION-001.md`
