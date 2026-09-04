# Evidence Bundle — `PROMPT-011-ASSURANCE-STABILIZATION-001`

Status: `LOCAL GATES PASS; INDEPENDENT REVIEW PENDING`
Repository: `KayzenRoot/uads`
Baseline Git SHA: `2cd8fde252737f31a24cd5b13ed766675fd40d3f`
Head Git SHA at local validation snapshot: `1ba1774`
Final PR head: `pending branch push/review creation`

This bundle records bounded evidence for Prompt 011. It separates locally reproducible evidence from exact-SHA GitHub evidence and maintainer-owned promotion actions.

## Claims

| Claim | Kind | Reference | Status | Notes |
| --- | --- | --- | --- | --- |
| Central assurance policy is deterministic and role-bound | source/test | `src/kernel/assurance-policy.ts`, `tests/assurance-policy.test.ts` | PASS | Exact reviewer roles and stable reason codes |
| Assurance record and finalize seams revalidate current identity | source/test | `src/kernel/execution.ts` | PASS | Current Work Order, routing, digest, evidence, gates, and specialist selection are checked |
| Adversarial assurance cases block unsafe states | evaluation | `evals/assurance/cases.json`, `src/eval/assurance.ts` | PASS | AS1-AS16 |
| Fault-injection cases remain fail-closed | evaluation | `evals/fault-injection/cases.json`, `src/eval/fault-injection.ts` | PASS | FI1-FI16 |
| Review packets are bounded and schema-validated | schema/source/test | `schemas/review-packet.schema.json`, `src/kernel/execution-persist.ts` | PASS | No secrets, prompts, arbitrary commands, or absolute host paths |
| New assurance gates are part of CI receipt and Direct Review | workflow/source/test | `.github/workflows/ci.yml`, `.github/workflows/direct-review.yml` | PASS | `eval-assurance` and `eval-fault-injection` are required |
| Linux/Windows Node 20 compatibility is required for v0.11.0 evidence | workflow/schema/source | `.github/workflows/compatibility.yml`, `schemas/compatibility-evidence.schema.json` | PASS | Exact-SHA outcome binding; external run still pending |
| Release title and version sources are coherent | source/test | `src/release/release-title.ts`, `VERSION`, `package.json` | PASS | v0.11.0 title is canonicalized |
| Historical v0.10.4 tag is immutable | repository inspection | `src/release/semver.ts`, tag inspection | PASS | Existing tag target `0936f818...` was not moved |
| Documentation drift and Prompt 011 obligations are recorded | documentation | `README.md`, `docs/07-QUALITY-GATES.md`, `docs/08-SECURITY.md`, `docs/09-PERFORMANCE.md`, `docs/13-DEFINITION-OF-DONE.md`, `docs/14-BACKLOG.md`, `docs/15-GITHUB-DIRECT-REVIEW.md` | PASS | Bounded scope and deferred Prompt 012 items are explicit |
| Local foundation and regression gates pass | command/output | `npm run validate` component sequence and CLI smoke | PASS_WITH_RECONSTRUCTED_COMPLETION | The first wrapper run was interrupted by user follow-up during `eval:fault`; the interrupted family was rerun 18/18 and every remaining wrapper command plus all four CLI smoke checks passed |
| Package and dependency smoke pass | command/output | `npm audit --audit-level=high`, `npm pack --dry-run` | PASS | 0 vulnerabilities; package smoke completed for `uads@0.11.0` |
| Exact-SHA Linux/Windows Node 20 compatibility runs pass | GitHub output | `.github/workflows/compatibility.yml` | PENDING_EXTERNAL | Local Windows smoke passed; hosted matrix evidence must be observed |
| CodeQL and Scorecard pass for final SHA | GitHub output | repository workflows | PENDING_EXTERNAL | No result is fabricated |
| Independent review and maintainer promotion exist | review | PR review/checkpoint | PENDING_MAINTAINER | Implementer cannot self-approve, merge, or publish |

## Local verification record

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript build/typecheck | PASS | `npm run build`, `npm run typecheck` after final source review |
| Full Vitest regression suite | PASS | 47 files, 329 tests; 1416.15s |
| Legacy evaluations | PASS | Orchestrator 9/9; Execution 9/9; Context 19/19; Fault 18/18; Cost 27/27; Model Routing 22/22; Specialist Routing 26/26; Adapters 40/40 |
| Assurance evaluation | PASS | `npm run eval:assurance`, 16/16 |
| Fault-injection evaluation | PASS | `npm run eval:fault-injection`, 16/16 |
| Focused assurance/execution/review/release tests | PASS | focused Vitest runs |
| Windows compatibility smoke | PASS | `node scripts/github/compatibility-smoke.mjs --platform windows` |
| Action pins | PASS | `npm run validate:actions` |
| CI receipt fixture | PASS | `npm run validate:ci-receipt` |
| Direct Review fixture | PASS | `npm run validate:direct-review` |
| Dependency audit | PASS | `npm audit --audit-level=high` |
| Package smoke | PASS | `npm pack --dry-run`, `uads@0.11.0`, 582 files |
| Clean dependency install | PASS | `npm ci`, 56 packages, 0 vulnerabilities |
| Dependency audit | PASS | `npm audit --audit-level=high`, 0 vulnerabilities |

The literal aggregate wrapper did not emit its final line because the user interrupted the first long-running process while it was in `eval:fault`. This is recorded as an execution interruption, not a test failure: the exact missing family and every subsequent command in the wrapper sequence were rerun and passed, including CLI `--help`, `doctor`, `status`, and `inspect --json`.

## Privacy and safety review

- Durable assurance packets and review records are bounded by schemas and contain no credentials, raw tokens, private keys, full prompts, arbitrary commands, or absolute host paths.
- Synthetic secret-like values exist only in isolated evaluation fixtures and are not evidence claims or credentials.
- No provider network call, deployment, dashboard, marketplace, branch-protection change, historical tag movement, or destructive external action was performed.
