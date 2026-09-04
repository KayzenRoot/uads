# 13 — Definition of done

## Prompt 001 increment

Complete only when all are true:

- Professional OSS structure
- NexLabs ownership reflected in docs
- Apache-2.0 license
- Architecture Freeze v0.2 documented
- Minimal CLI works
- Global sidecar workspace works
- Review ZIP generation works
- Review ZIP excludes secrets and heavy directories
- Checksum generated
- Schemas exist
- Skill entrypoint exists
- Tests exist and pass
- CI workflow exists
- Validation script exists and passes
- `CHANGELOG.md` and `VERSION` updated
- A review ZIP was generated
- Final review report includes files changed, tests run, results, and known limitations

## Prompt 002 increment

Complete only when all are true:

- Prompt 001 security/review guarantees remain passing
- Version is 0.2.0
- `uads inspect`, `plan --request`, `plan --intake`, `status`, and `resume` work
- Repository map is sidecar-only and cacheable
- Intake / Work Order / checkpoint / routing-decision schemas are enforced
- Implementer is never the sole final reviewer
- Orchestrator Skill uses progressive disclosure; skills preflight passes
- Correction 01: secret-safe persistence, required operational schema fields, CRITICAL→C4, radius-bounded candidates, complete gate registry, task-relevant repository risk
- Cursor adapter is tested against an isolated HOME
- Zero project footprint after inspect/plan/status/resume
- Orchestrator eval suite and negative-routing assertions pass
- lint, typecheck, build, tests, aggregate validation, and npm audit pass
- Final commit is on origin/main with a privacy-minimized review ZIP

## Prompt 003 increment

Complete only when all are true:

- Execution-run/packet schemas exist and persist in the sidecar
- `uads dispatch`, `verify`, `evidence record`, `assurance start/record`, and `finalize` work
- Evidence/reviews bind to the current change digest; stale digest cannot finalize
- Dirty worktree blocks dispatch without mutating user files
- Implementer cannot self-approve; required assurance roles are enforced
- Every currently selectable core role has a canonical `agents/uads-*.md` definition
- Execution evals X1–X9 pass; orchestrator evals remain 9/9
- Correction 01: content-hashed change digest, authoritative implementer session, assurance ordering, gate evidence contracts, sticky FAIL/BLOCKED, referential/corrupt-state fail-closed
- Correction 02: test-runner evidence is fail-closed; Vitest process exit is never reclassified from stdout
- Version is 0.3.0; lint/typecheck/build/tests/validate/npm audit pass

## Prompt 004 increment

Complete only when all are true:

- Version is 0.4.0
- Incremental index, JS/TS evidence-bearing graph, test map, and conservative interface map persist in the sidecar
- Impact reports separate in-scope, supporting, possible, excluded, and unresolved
- Context Packs are metadata-first and radius-bounded; C5 remains exceptional
- `uads index`, `uads impact`, `uads context pack`, and one-level `context expand` work
- `status` / `resume` do not trigger a full repository scan
- Stale/corrupt index identity is not silently accepted as current
- Context evals CCI1–CCI19 pass; orchestrator 9/9 and execution X1–X9 remain green
- Correction 01: clean commit-to-commit index refresh, content-aware dirty identity, no-Git revalidation, unresolved carry-forward, no silent truncation, conservative relationship classes
- Correction 02: lexically conservative JS/TS extraction, stateless computed-import evidence, reverse docs/config impact
- lint, typecheck, build, tests, skills validation, aggregate validation, and npm audit pass

## Prompt 005 increment

Complete only when all are true:

- Version is 0.5.0
- Normalized failure records, deterministic signatures, ranked hypotheses, and diagnostic Context Packs persist in the sidecar
- Compact Failure Memory is reusable only when post-correction candidate/dependency validity digests still match a complete current index; otherwise historical
- Loop detection fires on three distinct failure observations with the same signature and the same content-aware change identity; re-diagnosing one record does not count
- Verified resolution is bound to the failure's completed corrective execution (run, Work Order, digest, gates, independent review); candidates are not auto-promoted to `verifiedRootCausePaths`
- Failure recording and verified memory require the live canonical change digest to match the cited execution digest; later unverified edits are rejected until `uads verify`
- C5 remains exceptional; diagnostic expansion is one radius step
- `uads failure record`, `uads diagnose`, `uads failures`, and `uads failure show` work
- `status` / `resume` expose compact failure fields without a repository scan
- Review ZIPs include sanitized failure/diagnosis/memory summaries and no raw `--input` copies
- Fault evals FL1–FL18 pass; orchestrator 9/9, execution X1–X9, and context CCI1–CCI19 remain green
- lint, typecheck, build, tests, skills validation, aggregate validation, and npm audit pass

## Prompt 006 increment

Complete only when all are true:

- Version is 0.6.0
- Evidence Cache schemas and sidecar state exist; HIT requires a proven validity basis
- Relevant source/dependency/manifest/tool changes invalidate eligible cache; unrelated proven-outside-basis files do not
- Non-reusable assurance gates remain fresh-required; cache-reuse PASS is auditable and cannot impersonate executed PASS
- Current-digest FAIL/BLOCKED cannot be hidden by an older cached PASS
- Cost Governor avoids redundant eligible work and never skips required verification
- Soft token budget warns; hard token budget is fail-closed
- QPT snapshot is provider-neutral and documented; no invented prices or agent calls
- `uads cache status|explain` and `uads cost status|explain` work
- `status` / `resume` stay cheap and do not rescan the repository
- Cost evals CC1–CC14 pass; orchestrator 9/9, execution X1–X9, context CCI1–CCI19, and fault FL1–FL18 remain green
- lint, typecheck, build, tests, skills validation, aggregate validation, and npm audit pass

## Ongoing product DoD

A work order is done only with evidence for selected gates, footprint, independent review when implementation occurred, and (when requested) a review bundle.

## Prompt 008 increment

Complete only when all are true:

- Provider-neutral Model Profile, registry, Runtime Capability Snapshot, and Model Execution Plan schemas validate
- Global registry and per-project sidecar routing state preserve zero project footprint and reject unsafe/duplicate/malformed input
- Capability is negotiated before relative cost; runtime `unknown` is conservative false; no silent quality downgrade occurs
- Quality floor is risk/scope-aware, escalation is monotonic, fallbacks preserve the floor, and context/output/hard-budget limits fail closed
- Plan identities bind Work Order, change, registry, runtime, policy, and Context Pack layer digests; dispatch recomputes stale plans
- `uads models list|status|explain|route|register` and `uads capabilities status|explain` work without provider calls
- Runtime fallback metadata records sequential execution, role cycling, and null telemetry when unproven; host/runtime ownership for subagents and parallel agents is explicit
- Model routing evals MR1–MR22 and adversarial tests pass; existing orchestrator, execution, context, fault, and cost gates remain green
- Documentation, review summaries, release evidence, and 0.9.0 package metadata are updated only after the complete validation matrix passes

## GitHub Direct Review Evidence correction

Complete the correction only when all are true:

- `schemas/github-direct-review-evidence.schema.json` is strict, versioned, and validated by `npm run validate:direct-review`
- CI gates have stable IDs, streamed `pipefail`/`tee` logs, exact `UADS_DIRECT_REVIEW_BEGIN` / `UADS_DIRECT_REVIEW_END` markers, and an `if: always()` evidence step
- The SHA-bound 90-day Actions artifact is uploaded under `uads-direct-review-<commit-sha>` and contains no raw logs, secrets, or host paths
- Release validation, build, notes, and the external Review ZIP consume exact direct-review evidence and cross-check commit, CI, tag, manifest, validation, and release identities
- Parser uncertainty is explicit (`null` plus `COUNT_PARSE_UNAVAILABLE:*`); it cannot fabricate a PASS or a count
- CI, CodeQL, OpenSSF Scorecard, Dependency Review applicability, npm audit, packaging, release run, assets, and limitations are recorded

## Two-stage GitHub Direct Review correction

- Source CI emits one exact-SHA `uads-ci-gate-receipt-<SHA>` artifact with stable gate outcomes even when a required Foundation gate fails
- The privileged `workflow_run` Direct Review publisher runs only for `push` to `main`, checks out the exact source SHA, and rejects forged, ambiguous, stale, or mismatched receipts
- Canonical evidence is published by the dedicated Direct Review workflow with the stable `UADS_DIRECT_REVIEW_BEGIN` / `UADS_DIRECT_REVIEW_END` markers; its publication health is separate from the source verdict
- The release consumes the exact canonical Direct Review artifact and includes checksummed `github-direct-review-evidence.json` and `github-review-index.json`; index pointers cross-check CI run/attempt, Direct Review run, tag, release run, assets, and evidence SHA-256
- Existing historical tag targets remain unchanged and no immutable tag is moved or recreated
- Ordinary push comparisons are computed from full history with exact base/head/count, a complete changed-path-set digest, bounded/sanitized paths, truncation metadata, and an explicit unavailable/not-applicable reason when comparison cannot apply
- Prompt 008 specialist-routing package/release version was 0.9.0; its historical tag remains immutable alongside v0.8.0 and v0.8.1
# Prompt 009 completion conditions

- A valid global registry contains the built-in core and bounded domain catalog.
- A deterministic selection plan is persisted outside the managed repository and bound to Work Order/routing/registry/policy identities.
- Required domain, gate, evidence, and assurance coverage is present, or the plan is explicitly `BLOCKED` with stable reason codes.
- Independent review is separate from implementation; security, performance, and reliability assurance are distinct.
- SR1–SR26, adversarial tests, semantic dispatch/resume revalidation, existing validation matrix, CI receipt, Direct Review, and release evidence all pass for the exact release commit.

## Prompt 009 Correction 01 / v0.9.1

- Canonical gate and required-evidence obligations participate in deterministic minimum-sufficient specialist selection; coverage is persisted as required, covered, and unmet machine-readable obligations.
- Gate-only finance, Web3, migration/rollback, architecture, release, security, and performance work selects the required specialist or blocks with `UNMET_REQUIRED_EVIDENCE`.
- Affected-area activation is exact-token only; dependency escalation requires a structured deterministic signal and never parses arbitrary prose or filenames.
- Dispatch and resume reconstruct current specialist routing semantics and cross-check Work Order, Routing Decision, registry, Context/Impact identity, selected/assurance IDs, and assignments. Missing, stale, tampered, or divergent state fails closed.
- The v0.9.0 historical release and tag remain immutable; v0.9.1 is published only from the exact final main SHA after CI, Direct Review, CodeQL/Scorecard, and release verification.

## Prompt 010 / v0.10.0

- One common provider-neutral contract registers exactly Cursor, Codex, and Generic Agent Skills adapters.
- Detection is read-only and capabilities are conservative Runtime Capability Snapshots with explicit adapter provenance; no provider API or arbitrary command execution exists.
- Global installation/update/uninstall uses atomic ownership hashes, preserves unrelated resources, rejects unmanaged or modified files, and blocks traversal/symlink escape without touching the managed project.
- `uads adapters prepare` validates current Work Order, Routing Decision, Specialist Selection Plan, Model Execution Plan, runtime, Context/Impact, and execution identity before writing a sidecar-only Host Dispatch Bundle.
- Host fallback may serialize or use role cycling, but cannot add kernel-selected specialists, assurance, gates, evidence, scope, parallelism, or model quality.
- T1–T30-equivalent tests, AD1–AD22, the complete validation matrix, exact-SHA GitHub evidence, and release assets pass before v0.10.0 publication; v0.9.1 and earlier tags remain immutable.

## Prompt 010 Correction 01 / v0.10.1

Complete only when all are true:

- Default Codex/Generic adapter roots resolve to `~/.codex` and `~/.agents`, never bare user home.
- Missing default adapter roots are not reported as `SUPPORTED`; detection remains read-only.
- Adapter install/update failure restores host resources, sidecar state, and canonical `~/.uads/agents` bytes transactionally.
- Legacy v0.10.0 wrong-target Codex/Generic state migrates only with exact ownership proof or blocks fail-closed.
- T31–T40, AD23–AD28, all existing tests/evals, release title generation, exact-SHA GitHub evidence, and release assets pass before v0.10.1 publication; v0.10.0 and earlier tags remain immutable.

## Prompt 010 Correction 02 / v0.10.2

Complete only when all are true:

- No supported configuration can produce `.cursor/.cursor`, `.codex/.codex`, or `.agents/.agents`.
- Synthetic user-home and adapter-root overrides have one documented meaning per input/source class.
- Native environment-variable semantics are deterministic or explicitly ignored.
- Invalid/ambiguous override resolution is read-only and fail-closed across detect/install/status/explain/prepare.
- Legacy v0.10.0 migration and transactional rollback remain intact.
- T41–T48, AD29–AD32, all existing tests/evals, exact-SHA GitHub evidence, and release assets pass before v0.10.2 publication; v0.10.0 and v0.10.1 remain immutable.

## Prompt 010 Correction 03 / v0.10.3

Complete only when all are true:

- Installed adapter state binds ownership to a privacy-safe `targetRootDigest`, not semantic source labels alone.
- Cross-root identical-byte replay is rejected for inspect, install, uninstall, status, explain, prepare, and bundle staleness checks.
- Legacy unbound v0.10.0–v0.10.2 states block destructive uninstall and adopt binding only through explicit non-destructive install/update.
- Host Dispatch Bundles include `hostTargetRootDigest` and become stale when the resolved target root changes.
- No raw host paths appear in persisted state, status JSON, bundles, or release artifacts.
- T49–T56, AD33–AD36, all existing tests/evals, exact-SHA GitHub evidence, and release assets pass before v0.10.3 publication; v0.10.0–v0.10.2 remain immutable.

## Prompt 010 Correction 04 / v0.10.4

Complete only when all are true:

- Target-root canonicalization is absolute, lexically deterministic, separator-normalized, trailing-separator-safe, case-preserving, and never unconditionally case-folds filesystem identity.
- Current ownership uses binding v2 with `uads-host-target-root-v2`; newly written installed states never use binding v1.
- Valid v1 states remain readable but are stale/upgrade-required and cannot authorize destructive uninstall, update/delete, or trusted Host Dispatch Bundle preparation.
- Explicit v1-to-v2 adoption is non-destructive, exact-ownership-checked, transactional, and does not scan alternate roots or overwrite unrelated bytes.
- Host Dispatch Bundles and currentness checks use the v2 root digest, and raw host paths remain absent from persisted/evidence/release artifacts.
- T57–T64, AD37–AD40, all previous tests/evals, exact-SHA CI/Direct Review/CodeQL/Scorecard/audit/packaging evidence, and release assets pass before v0.10.4 publication; v0.10.3 and earlier tags remain immutable.
