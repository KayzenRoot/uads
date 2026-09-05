# Evidence Bundle — `PROMPT-011-ASSURANCE-STABILIZATION-001`

Status: `LOCAL GATES PASS; INDEPENDENT REVIEW PENDING`
Repository: `KayzenRoot/uads`
Baseline Git SHA: `2cd8fde252737f31a24cd5b13ed766675fd40d3f`
Head Git SHA at source/evidence snapshot: `4061946f301ff5b7ce5d3f0ddc231ab1a87cce09`
Hosted correction/evidence SHA: `4061946f301ff5b7ce5d3f0ddc231ab1a87cce09`
Finalization note: the remaining delivery change is evidence-only bookkeeping; its new PR head must be re-proven by the hosted matrix without changing source behavior.

This bundle records bounded evidence for Prompt 011. It separates locally reproducible evidence from exact-SHA GitHub evidence and maintainer-owned promotion actions.

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
| Release title and version sources are coherent | source/test | `src/release/release-title.ts`, `VERSION`, `package.json` | PASS | v0.11.0 title is canonicalized |
| Historical v0.10.4 tag is immutable | repository inspection | `src/release/semver.ts`, tag inspection | PASS | Existing tag target `0936f818...` was not moved |
| Documentation drift and Prompt 011 obligations are recorded | documentation | `README.md`, `docs/07-QUALITY-GATES.md`, `docs/08-SECURITY.md`, `docs/09-PERFORMANCE.md`, `docs/13-DEFINITION-OF-DONE.md`, `docs/14-BACKLOG.md`, `docs/15-GITHUB-DIRECT-REVIEW.md` | PASS | Bounded scope and deferred Prompt 012 items are explicit |
| Local foundation and regression gates pass | command/output | `npm run validate` component sequence and CLI smoke | PASS_WITH_RECONSTRUCTED_COMPLETION | The first wrapper run was interrupted by user follow-up during `eval:fault`; the interrupted family was rerun 18/18 and every remaining wrapper command plus all four CLI smoke checks passed |
| Package and dependency smoke pass | command/output | `npm audit --audit-level=high`, `npm pack --dry-run` | PASS | 0 vulnerabilities; package smoke completed for `uads@0.11.0` |
| C1 typed assurance evidence binding | source/evaluation | `src/kernel/assurance-policy.ts`, `src/kernel/execution.ts`, AS17-AS21 | PASS | Canonical typed Specialist Selection Plan is re-read/revalidated; prose and caller booleans are non-authoritative |
| C2 normative FI1-FI16 meanings and real boundaries | evaluation | `src/eval/fault-injection-normative.ts`, `evals/fault-injection/cases.json` | PASS | 16 normative cases plus FI17-FI32 retained legacy coverage |
| C3 exact-SHA compatibility artifact proof | source/schema/workflow | `scripts/github/generate-compatibility-evidence.mjs`, `scripts/github/compatibility-artifacts.mjs` | PASS | Explicit event-aware SHA, checkout/tree equality, exact run/job/artifact and digest validation |
| C4 managed findings-file path safety | source/evaluation | `src/kernel/execution.ts`, AS22 | PASS | Bounded ordinary JSON under managed repo/sidecar roots only; traversal/symlink/foreign/invalid/oversize inputs reject safely |
| C5 Dependency Graph/Dependency Review enabled | GitHub security setting/workflow | repository Settings / Dependency Review workflow `33930026983` | PASS | Dependency Graph was enabled and the same exact head `4061946…` passed on attempt `2`, job `101229407580`; attempt 1 failure is historical and explicitly resolved |
| Exact-SHA Linux/Windows Node 20 compatibility runs pass | GitHub output | `.github/workflows/compatibility.yml`, run `33930026912` | PASS | Both jobs and downloaded artifacts validate against SHA/tree/run/attempt; see hosted record below |
| CodeQL passes for correction SHA | GitHub output | CodeQL run `33930026878` | PASS | Exact head SHA `4061946…` |
| Historical Dependency Review attempt 1 | GitHub output | Dependency Review run `33930026983`, attempt `1` | RESOLVED | Attempt 1 failed because Dependency Graph was disabled; after enablement, attempt 2 on the same exact SHA passed |
| Scorecard and post-main Direct Review | GitHub output | repository workflows | NOT_APPLICABLE_FOR_OPEN_PR | These are post-main/release-chain evidence and cannot be claimed from this open PR |
| Independent review and maintainer promotion exist | review | PR review/checkpoint | PENDING_MAINTAINER | Implementer cannot self-approve, merge, or publish |

## Local verification record

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript build/typecheck | PASS | `npm run build`, `npm run typecheck` after final source review |
| Full Vitest regression suite | PASS | 47 files, 329 tests; 1948.16s |
| Legacy evaluations | PASS | Orchestrator 9/9; Execution 9/9; Context 19/19; Fault 18/18; Cost 27/27; Model Routing 22/22; Specialist Routing 26/26; Adapters 40/40 |
| Assurance evaluation | PASS | `npm run eval:assurance`, 22/22 |
| Fault-injection evaluation | PASS | `npm run eval:fault-injection`, normative FI1-FI16 + legacy FI17-FI32, 32/32 |
| Focused assurance/execution/review/release tests | PASS | focused Vitest runs |
| Windows compatibility smoke | PASS | `node scripts/github/compatibility-smoke.mjs --platform windows` |
| Action pins | PASS | `npm run validate:actions` |
| CI receipt fixture | PASS | `npm run validate:ci-receipt` |
| Direct Review fixture | PASS | `npm run validate:direct-review` |
| Dependency audit | PASS | `npm audit --audit-level=high` |
| Package smoke | PASS | `npm pack --dry-run`, `uads@0.11.0`, 586 files |
| Clean dependency install | PASS | `npm ci`, 56 packages, 0 vulnerabilities |
| Dependency audit | PASS | `npm audit --audit-level=high`, 0 vulnerabilities |

## Hosted exact-SHA record

The hosted correction run is `UADS Cross-Platform Compatibility` run `33930026912`, attempt `1`, head SHA `4061946f301ff5b7ce5d3f0ddc231ab1a87cce09`, source tree SHA `c806ab2cde22f414e34d2dfda79f4ee2832b4f97`, with workflow URL `https://github.com/KayzenRoot/uads/actions/runs/33930026912`. Both jobs completed successfully: Linux job `101206556191` and Windows job `101206556350`, each named `<platform> / Node 20`, running Node `v20.20.2`.

| Platform | Artifact | Artifact service digest | Downloaded evidence file SHA-256 | Evidence digest | Fixed checks |
| --- | --- | --- | --- | --- | --- |
| Linux | `uads-compatibility-linux-4061946f301ff5b7ce5d3f0ddc231ab1a87cce09` | `sha256:d81ccf5655bc7102bbbecd240f98a7ff5c99a96aaa3478ad66cdacf6066deddf` | `24e96de90b0fcdb1faca8d11f7e8216578fe5da0c9d8651c26987cc3af02433d` | `ca4d802cc97684f8e981baadefb7ab970aed459b169c4e8e1da3fafc95bc40ba` | npm-ci, typecheck-build, adapter-eval, isolated-install, root-resolution, zero-project-footprint, privacy-path-assertion = success |
| Windows | `uads-compatibility-windows-4061946f301ff5b7ce5d3f0ddc231ab1a87cce09` | `sha256:f03ea6989fa60a25b9f66ad26b4cb2f0578fff415dc8c4d02745c4ace6c82070` | `517742869de565ead6ebe2e60e7040d195aba4076c3710fafda0648e8ff5502e` | `203922bad55de4eabfcaa1bc688c2047a73a9bd66796abdb7da12be0227a7591` | npm-ci, typecheck-build, adapter-eval, isolated-install, root-resolution, zero-project-footprint, privacy-path-assertion = success |

The CI Foundation run is `33930026879`, attempt `1`, head SHA `4061946f301ff5b7ce5d3f0ddc231ab1a87cce09`, job `101206556051`, and conclusion PASS. Its exact-SHA receipt artifact is `uads-ci-gate-receipt-3d9b693c19a34acd2ad2ce72facdd7b2b6837a26` with service digest `sha256:392f6fbf6068c51c57eb1440b592cd582951886282cbb1a9eef0eded1e73219f`; the receipt itself records all required gates PASS, 47/47 files, 329/329 tests, AS 22/22, FI 32/32, and no high-or-greater npm vulnerabilities. The PR receipt necessarily records the GitHub `pull_request` merge ref `3d9b693c…`; the compatibility artifacts above are the separate exact head-SHA proof required for the correction.

CodeQL run `33930026878` concluded PASS for the correction SHA. Dependency Review run `33930026983` attempt `1` failed because Dependency Graph was disabled; attempt `2` completed successfully on the same exact head SHA. No workflow relaxation, `continue-on-error`, or fabricated PASS was introduced.

The literal aggregate wrapper did not emit its final line because the user interrupted the first long-running process while it was in `eval:fault`. This is recorded as an execution interruption, not a test failure: the exact missing family and every subsequent command in the wrapper sequence were rerun and passed, including CLI `--help`, `doctor`, `status`, and `inspect --json`.

## Privacy and safety review

- Durable assurance packets and review records are bounded by schemas and contain no credentials, raw tokens, private keys, full prompts, arbitrary commands, or absolute host paths.
- Synthetic secret-like values exist only in isolated evaluation fixtures and are not evidence claims or credentials.
- No provider network call, deployment, dashboard, marketplace, branch-protection change, historical tag movement, or destructive external action was performed.
