# Evidence Bundle — `PROMPT-011-ASSURANCE-STABILIZATION-001`

Status: `PROMOTION_COMPLETE; CORRECTION_04_SECURITY_PROOF_READY_FOR_REVIEW`
Repository: `KayzenRoot/uads`
Baseline Git SHA for the corrected promotion: `d5cb361274cb19f70c8bd02dd023b596b8babf13`
Historical Prompt 011 source/evidence SHA: `4061946f301ff5b7ce5d3f0ddc231ab1a87cce09`
Correction 04 branch head: `cd8ee842e2dee9a9162d65c4255721cb0296515d`
Finalization note: the historical Prompt 011 promotion record above is retained; Correction 04 adds release security-proof authority and requires a fresh hosted matrix on its focused branch. No v0.11.0 artifact/tag/release is changed and v0.11.1 is not published here.

This bundle records bounded evidence for Prompt 011. It separates locally reproducible evidence from exact-SHA GitHub evidence and maintainer-owned promotion actions.

## Correction 04 — release security proof

| Claim | Kind | Reference | Status | Notes |
| --- | --- | --- | --- | --- |
| CodeQL and Scorecard are authoritative exact-SHA proofs for corrected releases | source/schema/test | `src/github/security-proof.ts`, `scripts/github/security-proof.mjs`, Direct Review/release barriers | READY | Each proof binds repository, final commit/tree, source commit/tree, run/attempt, URL, outcome, and canonical digest; Scorecard is accepted only from push-to-main |
| Dependency Review is authoritative by exact SHA or same-tree merged PR | source/schema/test | `src/github/security-proof.ts`, `scripts/github/security-proof.mjs` | READY | Same-tree mode requires exactly one merged PR into main, same repository, source SHA/tree, final SHA/tree, and exactly one successful pull-request run |
| Missing, unknown, failed, ambiguous, mismatched, or tampered security evidence cannot authorize PASS | test | `tests/release-security-proof.test.ts` | PASS | RG1-RG10 and RG13 cover fail-closed cases; RG11 covers all-pass authorization |
| Security proof digests agree across evidence/index/release seams | source/test | `src/github/direct-review.ts`, `src/github/review-index.ts`, `scripts/release/*.mjs`, `src/lib/release-review.ts` | READY | Independent reconstruction is performed before tag/release mutation and is checked again for derivatives |
| v0.11.0 remains historical and immutable; v0.11.1 is prepared but unpublished | repository/version | tag/release inspection, `VERSION`, `CHANGELOG.md` | PASS_LOCAL | v0.11.0 baseline is `d5cb361274cb19f70c8bd02dd023b596b8babf13`; no v0.11.1 tag/release is created by this correction |

Read-only reconstruction against the audited promoted `main` identity (`d5cb361274cb19f70c8bd02dd023b596b8babf13`, tree `0c9e06deedf40b9cbe55e784c74fbc4b63b8bebd`) produced the following observed proof inputs for the corrected contract. These are baseline observations, not a claim that the open Correction 04 branch has post-merge release evidence:

| Workflow | Proof mode | Run / attempt | Source identity | Proof digest |
| --- | --- | --- | --- | --- |
| CodeQL | exact-sha | `33941376769 / 1` | final/source `d5cb361…` / `0c9e06…` | `50ea73e6093d3c210e77fc9a7c02af184b92f3c917847e82201008fbab05eafa` |
| Scorecard | exact-sha | `33941376795 / 1` | final/source `d5cb361…` / `0c9e06…` | `0034ec1c86d1758a7bf433fa21cee1df6dce48cba963edd2586ebad12d661640` |
| Dependency Review | same-tree-pr, PR #12 | `33939630957 / 1` | source `2e62866…` / `0c9e06…`; final `d5cb361…` / `0c9e06…` | `af2b1c8f872afb0cf0821f4a6b68191a2514dda390543aed2b8a96f323ed3f34` |

Correction 04 PR #14 pre-merge hosted validation is green for head `cd8ee842e2dee9a9162d65c4255721cb0296515d`, tree `ef45d07c5533a190097cedd859dea154abac407c`, against base `d5cb361274cb19f70c8bd02dd023b596b8babf13`:

| Check | Run / attempt | Job | Status | Boundary |
| --- | --- | --- | --- | --- |
| Foundation | `33961541316 / 1` | `101294155802` | PASS | full CI matrix, 48 files / 343 tests, evals, validators, receipt |
| CodeQL | `33961541293 / 1` | `101294155748` | PASS | PR head validation; final release proof remains exact push-to-main |
| Compatibility | `33961541317 / 1` | `101294155915` Linux; `101294155795` Windows | PASS | exact PR head/tree, Node 20 |
| Dependency Review | `33961541306 / 1` | `101294155693` | PASS | pull request dependency review |

Scorecard and Direct Review are intentionally not claimed for the open PR: Scorecard is push-to-main only, and Direct Review is triggered from the post-merge compatibility workflow. A maintainer must obtain those fresh post-merge observations before any corrected-release authorization.

## Claims

| Claim | Kind | Reference | Status | Notes |
| --- | --- | --- | --- | --- |
| Central assurance policy is deterministic and role-bound | source/test | `src/kernel/assurance-policy.ts`, `tests/assurance-policy.test.ts` | PASS | Exact reviewer roles and stable reason codes |
| Assurance record and finalize seams revalidate current identity | source/test | `src/kernel/execution.ts` | PASS | Current Work Order, routing, digest, evidence, gates, and specialist selection are checked |
| Adversarial assurance cases block unsafe states | evaluation | `evals/assurance/cases.json`, `src/eval/assurance.ts` | PASS | AS1-AS22; typed obligations and findings-file path safety included |
| Normative fault-injection cases remain fail-closed | evaluation | `evals/fault-injection/cases.json`, `src/eval/fault-injection.ts`, `src/eval/fault-injection-normative.ts` | PASS | FI1-FI16 normative real-boundary cases; FI17-FI32 legacy regressions |
| Review packets are bounded and schema-validated | schema/source/test | `schemas/review-packet.schema.json`, `src/kernel/execution-persist.ts` | PASS | No secrets, prompts, arbitrary commands, or absolute host paths |
| New assurance gates are part of CI receipt and Direct Review | workflow/source/test | `.github/workflows/ci.yml`, `.github/workflows/direct-review.yml` | PASS | `eval-assurance` and `eval-fault-injection` are required |
| Linux/Windows Node 20 compatibility is required for v0.11.0 evidence | workflow/schema/source | `.github/workflows/compatibility.yml`, `schemas/compatibility-evidence.schema.json`, `scripts/github/compatibility-artifacts.mjs` | PASS | Exact SHA/tree/run/attempt/job/platform/artifact/digest binding is implemented and proved by run `33930026912` on `4061946…` |
| Release title and version sources are coherent | source/test | `src/release/release-title.ts`, `VERSION`, `package.json` | PASS | Historical v0.11.0 remains canonical; corrected 0.11.1 metadata is coherent and unpublished |
| Historical v0.10.4 tag is immutable | repository inspection | `src/release/semver.ts`, tag inspection | PASS | Existing tag target `0936f818...` was not moved |
| Solo-maintainer governance is internally consistent | GitHub protection/API and documentation | `GOVERNANCE.md`, `.github/CODEOWNERS`, `main` branch protection | PASS | Mode `SOLO_MAINTAINER`; before: approvals `1`, code-owner review `true`; after: approvals `0`, code-owner review `false`; only `KayzenRoot` is review-eligible |
| Existing branch protections remain intact | GitHub protection/API | `main` branch protection | PASS | PR required; strict `Foundation checks` required; stale dismissal, linear history, conversation resolution preserved; force pushes/deletion forbidden; administrator enforcement unchanged (`false`); restrictions unchanged (`null`) |
| Documentation drift and Prompt 011 obligations are recorded | documentation | `README.md`, `docs/07-QUALITY-GATES.md`, `docs/08-SECURITY.md`, `docs/09-PERFORMANCE.md`, `docs/13-DEFINITION-OF-DONE.md`, `docs/14-BACKLOG.md`, `docs/15-GITHUB-DIRECT-REVIEW.md` | PASS | Bounded scope and deferred Prompt 012 items are explicit |
| Local foundation and regression gates pass | command/output | `npm run validate` component sequence and CLI smoke | PASS_WITH_RECONSTRUCTED_COMPLETION | The first wrapper run was interrupted by user follow-up during `eval:fault`; the interrupted family was rerun 18/18 and every remaining wrapper command plus all four CLI smoke checks passed |
| Package and dependency smoke pass | command/output | `npm audit --audit-level=high`, `npm pack --dry-run` | PASS | 0 vulnerabilities; corrected package smoke completed for `uads@0.11.1` |
| C1 typed assurance evidence binding | source/evaluation | `src/kernel/assurance-policy.ts`, `src/kernel/execution.ts`, AS17-AS21 | PASS | Canonical typed Specialist Selection Plan is re-read/revalidated; prose and caller booleans are non-authoritative |
| C2 normative FI1-FI16 meanings and real boundaries | evaluation | `src/eval/fault-injection-normative.ts`, `evals/fault-injection/cases.json` | PASS | 16 normative cases plus FI17-FI32 retained legacy coverage |
| C3 exact-SHA compatibility artifact proof | source/schema/workflow | `scripts/github/generate-compatibility-evidence.mjs`, `scripts/github/compatibility-artifacts.mjs` | PASS | Explicit event-aware SHA, checkout/tree equality, exact run/job/artifact and digest validation |
| C4 managed findings-file path safety | source/evaluation | `src/kernel/execution.ts`, AS22 | PASS | Bounded ordinary JSON under managed repo/sidecar roots only; traversal/symlink/foreign/invalid/oversize inputs reject safely |
| C5 Dependency Graph/Dependency Review enabled | GitHub security setting/workflow | repository Settings / Dependency Review workflow `33930026983` | PASS | Dependency Graph was enabled and the same exact head `4061946…` passed on attempt `2`, job `101229407580`; attempt 1 failure is historical and explicitly resolved |
| Exact-SHA Linux/Windows Node 20 compatibility runs pass | GitHub output | `.github/workflows/compatibility.yml`, run `33930026912` | PASS | Both jobs and downloaded artifacts validate against SHA/tree/run/attempt; see hosted record below |
| CodeQL passes for correction SHA | GitHub output | CodeQL run `33930026878` | PASS | Exact head SHA `4061946…` |
| Historical Dependency Review attempt 1 | GitHub output | Dependency Review run `33930026983`, attempt `1` | RESOLVED | Attempt 1 failed because Dependency Graph was disabled; after enablement, attempt 2 on the same exact SHA passed |
| Scorecard and post-main Direct Review | GitHub output | repository workflows | NOT_APPLICABLE_FOR_OPEN_PR | These are post-main/release-chain evidence and cannot be claimed from this open PR |
| Independent technical audit and maintainer promotion exist | review | PR comment/review `5119401125`, checkpoint | AUDIT_RECORDED; PROMOTION_PENDING | Audit is recorded; GitHub APPROVE is intentionally not required in current solo-maintainer mode; implementer cannot merge or publish |

## Governance correction record

Correction 03 selected `SOLO_MAINTAINER` from the bounded pre-flight: repository `KayzenRoot/uads` is public, the default branch is `main`, the PR author is `KayzenRoot`, the only API-exposed collaborator is `KayzenRoot` with admin permission, and `.github/CODEOWNERS` assigns every listed path plus the wildcard to `@KayzenRoot`.

Before the change, classic protection for `main` required pull requests, one approving review, code-owner review, stale-review dismissal, strict `Foundation checks`, linear history, conversation resolution, and prohibited force pushes/deletion. Administrator enforcement was disabled and restrictions were null. After the change, only the impossible review requirements changed: required approvals are `0` and code-owner review is `false`. All other recorded protection values remain unchanged. PR #12 reports `mergeable=true` and `mergeable_state=clean` while remaining open.

The hosted exact-head matrix must be checked for the Correction 04 branch after push. Unlike Correction 03, this correction intentionally changes runtime release-proof source, schemas, tests, release metadata, and release workflow enforcement; no historical tag or release is changed.

## Local verification record

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript build/typecheck | PASS | `npm run build`, `npm run typecheck` after final source review |
| Full Vitest regression suite | PASS | 48 files, 343 tests; 1477.73s; +14 RG tests documented |
| Legacy evaluations | PASS | Orchestrator 9/9; Execution 9/9; Context 19/19; Fault 18/18; Cost 27/27; Model Routing 22/22; Specialist Routing 26/26; Adapters 40/40 |
| Assurance evaluation | PASS | `npm run eval:assurance`, 22/22 |
| Fault-injection evaluation | PASS | `npm run eval:fault-injection`, normative FI1-FI16 + legacy FI17-FI32, 32/32 |
| Focused assurance/execution/review/release tests | PASS | focused Vitest runs |
| Windows compatibility smoke | PASS | `node scripts/github/compatibility-smoke.mjs --platform windows` |
| Action pins | PASS | `npm run validate:actions` |
| CI receipt fixture | PASS | `npm run validate:ci-receipt` |
| Direct Review fixture | PASS | `npm run validate:direct-review` |
| Dependency audit | PASS | `npm audit --audit-level=high` |
| Package smoke | PASS | `npm pack --dry-run`, `uads@0.11.1`, 590 files |
| Clean dependency install | PASS | `npm ci`, 56 packages, 0 vulnerabilities |
| Dependency audit | PASS | `npm audit --audit-level=high`, 0 vulnerabilities |

| Security-proof focused regression | PASS | `npm run test:security-proof`, RG1-RG14, 14/14 |
| Corrected release metadata | PASS_LOCAL | package/VERSION/lock/changelog/schema/title support `0.11.1`; publication intentionally deferred |

## Hosted exact-SHA record

The hosted historical correction run is `UADS Cross-Platform Compatibility` run `33930026912`, attempt `1`, head SHA `4061946f301ff5b7ce5d3f0ddc231ab1a87cce09`, source tree SHA `c806ab2cde22f414e34d2dfda79f4ee2832b4f97`, with workflow URL `https://github.com/KayzenRoot/uads/actions/runs/33930026912`. Both jobs completed successfully: Linux job `101206556191` and Windows job `101206556350`, each named `<platform> / Node 20`, running Node `v20.20.2`. This is historical evidence for the already-promoted Prompt 011 snapshot; Correction 04 requires a fresh hosted matrix for its own head.

| Platform | Artifact | Artifact service digest | Downloaded evidence file SHA-256 | Evidence digest | Fixed checks |
| --- | --- | --- | --- | --- | --- |
| Linux | `uads-compatibility-linux-4061946f301ff5b7ce5d3f0ddc231ab1a87cce09` | `sha256:d81ccf5655bc7102bbbecd240f98a7ff5c99a96aaa3478ad66cdacf6066deddf` | `24e96de90b0fcdb1faca8d11f7e8216578fe5da0c9d8651c26987cc3af02433d` | `ca4d802cc97684f8e981baadefb7ab970aed459b169c4e8e1da3fafc95bc40ba` | npm-ci, typecheck-build, adapter-eval, isolated-install, root-resolution, zero-project-footprint, privacy-path-assertion = success |
| Windows | `uads-compatibility-windows-4061946f301ff5b7ce5d3f0ddc231ab1a87cce09` | `sha256:f03ea6989fa60a25b9f66ad26b4cb2f0578fff415dc8c4d02745c4ace6c82070` | `517742869de565ead6ebe2e60e7040d195aba4076c3710fafda0648e8ff5502e` | `203922bad55de4eabfcaa1bc688c2047a73a9bd66796abdb7da12be0227a7591` | npm-ci, typecheck-build, adapter-eval, isolated-install, root-resolution, zero-project-footprint, privacy-path-assertion = success |

The CI Foundation run is `33930026879`, attempt `1`, head SHA `4061946f301ff5b7ce5d3f0ddc231ab1a87cce09`, job `101206556051`, and conclusion PASS. Its exact-SHA receipt artifact is `uads-ci-gate-receipt-3d9b693c19a34acd2ad2ce72facdd7b2b6837a26` with service digest `sha256:392f6fbf6068c51c57eb1440b592cd582951886282cbb1a9eef0eded1e73219f`; the receipt itself records all required gates PASS, 47/47 files, 329/329 tests, AS 22/22, FI 32/32, and no high-or-greater npm vulnerabilities. The PR receipt necessarily records the GitHub `pull_request` merge ref `3d9b693c…`; the compatibility artifacts above are the separate exact head-SHA proof required for the correction.

CodeQL run `33930026878` concluded PASS for the historical correction SHA. Dependency Review run `33930026983` attempt `1` failed because Dependency Graph was disabled; attempt `2` completed successfully on the same exact head SHA. No workflow relaxation, fabricated PASS, or PR Scorecard result was introduced. The Correction 04 hosted run IDs, proof observations, and final PR identity must be appended after the branch is pushed; until then they are not claimable.

The literal aggregate wrapper did not emit its final line because the user interrupted the first long-running process while it was in `eval:fault`. This is recorded as an execution interruption, not a test failure: the exact missing family and every subsequent command in the wrapper sequence were rerun and passed, including CLI `--help`, `doctor`, `status`, and `inspect --json`.

## Privacy and safety review

- Durable assurance packets and review records are bounded by schemas and contain no credentials, raw tokens, private keys, full prompts, arbitrary commands, or absolute host paths.
- Synthetic secret-like values exist only in isolated evaluation fixtures and are not evidence claims or credentials.
- No provider network call, deployment, dashboard, marketplace, historical tag movement, or destructive external action was performed. The only external change from the completed historical Prompt 011 delivery was the bounded solo-maintainer branch-protection adjustment recorded above. Correction 04 has not performed a merge, tag, release, or v0.11.1 publication.
