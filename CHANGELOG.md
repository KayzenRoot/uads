# Changelog

All notable changes to UADS (NexLabs) are documented here.

## [Unreleased]

### Added

- Strict GitHub Direct Review Evidence schema, bounded parsers, exact-SHA Actions artifact generation, CI log markers, release derivatives, and adversarial validation.
- Two-stage CI gate receipts and post-CI canonical Direct Review publication with exact run/attempt cross-checks and checksummed GitHub review index.

### Security / Supply Chain

- Direct-review outputs exclude raw logs, secrets, and host paths; unavailable counts and GitHub security limitations remain explicit instead of being inferred as PASS.

## [0.8.1] - 2026-09-02

### Highlights

- Corrected host/runtime capability ownership for subagent and parallel execution negotiation.
- Added deterministic full-history Direct Review comparisons with exact counts, bounded paths, complete-set digests, truncation metadata, and explicit unavailable reasons.

### Fixed

- `subagents` and `parallelAgents` no longer require model-profile support when they are host/runtime capabilities; `maxConcurrency: 1` still forces sequential execution.
- Direct Review Stage B now recalculates and validates the source comparison from the exact full-history checkout, preventing shallow-checkout null comparisons from becoming PASS evidence.
- Preserved immutable historical tag `v0.8.0`; this correction is released as `v0.8.1`.

### Verification

- MR21/MR22 and Direct Review T6–T10 are included in the validation matrix.
- The release is bound to the exact final commit, successful CI receipt, canonical Direct Review artifact, CodeQL/Scorecard status, checksums, and final Review ZIP.

## [0.8.0] - 2026-09-02

### Added

- Provider-neutral Model Profile, global registry, Runtime Capability Snapshot, and evidence-bearing Model Execution Plan contracts.
- Deterministic capability-before-cost routing with risk/scope quality floors, reasoning/context/output checks, ordinal relative cost/latency, stable reason codes, and lexicographic tie-breaking.
- Conservative runtime intersection: unknown capabilities are unavailable; critical/high assurance work fails closed without a sufficient proven profile; empty non-critical routing is explicitly host-managed compatibility.
- Monotonic failure/loop escalation, floor-preserving fallbacks, explicit preference floor protection, cache-layer digest hints, and sequential/role-cycling runtime fallbacks.
- CLI commands `models list|status|explain|route|register` and `capabilities status|explain`.
- MR1–MR22 model-routing evaluation suite and adversarial tests for schema closure, duplicate/corrupt state, path/secret safety, stale identity, and no provider HTTP invocation.

### Changed

- `plan`, `dispatch`, `status`, `resume`, and review snapshots now expose model routing identity and selection metadata while preserving Architecture Freeze v0.2 and zero project footprint.
- Dispatch revalidates Work Order, change, registry, runtime, policy, and Context Pack identities before creating an execution run.

### Security / Scope

- Profile/runtime imports are bounded, schema-closed, deterministic, secret/path screened, and never executed as code. Provider credentials, URLs, hooks, live catalogs, prices, and provider API calls remain out of scope.

### Verification

- Full validation matrix, CI binding, security workflows, release assets, and a privacy-minimized Review ZIP are required for the final release record.

## [0.7.1] - 2026-08-31

### Highlights

- Hardened release evidence and final Review ZIP integrity for reproducible, identity-bound release audits.
- Added a canonical `ci-binding.json` release asset binding the published artifacts to one successful Foundation CI run and exact commit.

### Fixed

- Review snapshots no longer ingest repository-root UADS staging directories (`tmp/`, `.tmp/`, and `release/`) in the canonical UADS repository.
- Release review inspection now fails closed on missing, conflicting, stale, or SHA-inconsistent GitHub and release evidence.
- Release automation rejects ephemeral CI-binding paths and placeholder release notes.

### Verification

- The release sequence requires local validation, exact main-branch CI binding, release manifest/report/checksum verification, remote asset verification, and a clean final worktree.

### Assets

- `uads-0.7.1.tgz`, SPDX SBOM, `SHA256SUMS.txt`, `release-manifest.json`, `validation-report.json`, and `ci-binding.json`.

### Compatibility

- Node.js `>=20`; npm publication is not performed by this repository's release workflow.

### Security / Supply Chain

- Release metadata rejects credential-like values and absolute host paths; workflow actions remain pinned to immutable commit SHAs.

### Pre-1.0 Notice

- UADS remains pre-1.0.0; compatibility and release evidence contracts may evolve between minor releases.

## [0.7.0] - 2026-08-31

### Added

- Professional GitHub repository governance with issue forms, CODEOWNERS, Dependabot grouping, labels, release-note categories, and documented maintainer continuity.
- Immutable-action-pinned CI, CodeQL, dependency review, OpenSSF Scorecard, and manual release workflows with least-privilege permissions.
- Deterministic release tooling for SemVer validation, exact historical tag mapping, npm packaging, SPDX SBOM, SHA-256 checksums, release manifests, and machine-readable validation reports.
- GitHub configuration and audit helpers that re-read remote state and report permission or plan limitations without exposing credentials.

### Changed

- Product version sources now consistently identify `0.7.0`; the Architecture Freeze and historical schema versions remain unchanged.
- Release policy, security support, contribution requirements, and governance documentation now describe the reproducible pre-1.0 lifecycle.

### Security

- Workflow action references are required to use immutable 40-character commit SHAs and are validated as part of the mandatory foundation path.
- Release outputs reject credential-like values and absolute host paths; npm publication remains explicitly out of scope.

## [0.6.0] - 2026-08-30

### Added

- Deterministic Evidence Cache with sidecar `cache/evidence-index.json`, per-record validity basis, and explainable HIT/MISS/STALE/NOT_REUSABLE/BLOCKED decisions
- Conservative gate reuse policy: eligible command gates (static, unit-test, contract-test, build, web3-unit) only; integration-test, reviews, security, migration, Web3 fuzz, and invariants stay fresh-required
- Cost Governor with provider-neutral ledger, hard/soft token-budget enforcement, and documented QPT snapshot (`verifiedQualityCoverage / max(1, estimatedContextTokens/1000)`)
- CLI: `uads cache status|explain`, `uads cost status|explain`
- Optional evidence provenance fields (`source`, `sourceCacheRecordId`, `sourceEvidenceId`, `cacheDecisionId`) on existing 0.3.0 evidence records
- Optional Context Pack layer digests (`staticLayerDigest`, `semiStableLayerDigest`, `dynamicLayerDigest`) on 0.4.0 packs
- Review ZIP summaries `cache/cache-summary.json` and `cost/cost-summary.json`
- Cost eval suite `npm run eval:cost` (CC1–CC27)

### Fixed (Correction 02)

- Toolchain provability: command-gate reuse requires a supported producer with an exact resolved version (lockfile, node_modules, or exact dep — not semver ranges alone)
- Unknown producers (e.g. mystery-bundler) cannot create reusable cache records or HIT
- Cache-reuse evidence provenance enforced at gate evaluation with cross-checks against CacheDecision and EvidenceCacheRecord
- Evidence schema requires provenance fields when `source=cache-reuse`
- Cache candidate semantic validation enforces canonical gate evidence kinds before HIT/maySatisfyGate
- Cache-reuse chains now require reusable PASS source records, current work-order/run bindings, concrete gate proof, and a valid decision-to-record relationship
- Malformed, contradictory, symlink-escaping, or `file:`/`link:` producer metadata remains unprovable and therefore fresh-required

### Fixed (Correction 01)

- Gate reuse contract identity: current command/toolchain must match cached PASS before HIT
- Toolchain identity from package manifests (vitest/jest/tsc/eslint) rather than UADS Node alone
- `integration-test` defaults to NOT_REUSABLE without a complete environment contract
- Cache validity basis includes configures edges and test/build config files
- Reuse proof digest on cache records, decisions, and cache-reuse evidence
- Validity-first candidate selection (createdAt descending) with truthful STALE when all candidates are stale
- Token budget preflight before publishing current Context Pack on dispatch/expand
- Diagnostic token accounting, QPT diagnostic exposure, diagnosis reuse, and post-assurance QPT refresh

### Notes

- Cache HIT creates a derived current-digest evidence record; it does not mutate the originating PASS
- Current-digest FAIL/BLOCKED cannot be hidden by an older cached PASS
- Unrelated files outside the proven validity basis do not globally invalidate eligible cache
- Token estimates remain `byte-heuristic`; QPT is not financial cost or a provider tokenizer count
- `estimatedDiagnosticTokens` is tracked separately and is not part of the QPT denominator
- `status` / `resume` read compact cache/cost fields without a repository scan
- Intelligence schemas remain 0.4.0; execution schemas remain 0.3.0; failure schemas remain 0.5.0

## [0.5.0] - 2026-08-30

### Added

- Normalized secret-safe failure records with deterministic signatures
- Fault ranking from stack frames, failing tests, related diffs, Test Map, dependency graph, and Interface Map
- Diagnostic Context Packs under sidecar `context/diagnostic-packs/` (metadata-first; C5 remains exceptional)
- Compact per-project Failure Memory with post-correction validity, invalidation, and loop detection (N=3 distinct observations, same signature + content-aware digest)
- CLI: `uads failure record`, `uads diagnose`, `uads failures`, `uads failure show`
- Compact `status` / `resume` failure fields without a repository scan
- Sanitized failure/diagnosis/memory summaries in review ZIPs
- Fault eval suite `npm run eval:fault` (FL1–FL18)

### Notes

- Ranking is heuristic, not calibrated probability. Diagnosis is not verified root cause
- Repeated diagnosis of one Failure Record is not a repeated failure; loops require distinct observations
- Verified correction is bound to the failure's completed execution, current digest, passing gates, and independent review
- `verifiedRootCausePaths` is not auto-filled from ranked candidates; uncertainty stays historical when proof is missing
- Reusable memory uses post-correction candidate/dependency validity, not pre-fix hypothesis digests
- Failure `--input` files are not copied into the sidecar or review ZIP; symlink escape outside repo/sidecar is rejected
- A stored execution digest is not enough if the live worktree has changed; stale binding requires `uads verify` again
- Verified correction memory is hashed only from the code state covered by its gates/review; later unverified edits cannot be absorbed
- Intelligence schemas remain 0.4.0; execution schemas remain 0.3.0

### Correction 01

- Bound verified resolution to the corrective execution/work order; standalone records cannot inherit an unrelated completed run
- Stopped auto-promotion of hypotheses into `verifiedRootCausePaths`
- Refreshed Failure Memory validity from the post-fix index, including direct dependency/interface/test neighbors
- Made loop counting idempotent for `uads diagnose`
- Reused content-aware change identity for standalone failure attempts
- Rejected `--input` symlinks whose real path leaves the repository or project sidecar

### Correction 02

- Rejected failure recording when the live canonical digest differs from the execution run's stored digest
- Refused explicit verified resolution when the live worktree no longer matches the verified corrective digest
- Shared `computeLiveChangeDigest` with the Execution Engine so record/resolve/verify/finalize use one content-aware identity

## [0.4.0] - 2026-08-29

### Added

- Incremental repository intelligence in the sidecar: index state, evidence-bearing JS/TS dependency graph, test map, and conservative interface map
- Impact reports and metadata-first Context Packs bound to Work Order / index identity
- CLI: `uads index`, `uads impact`, `uads context pack`; `context expand` refreshes impact/pack one radius level
- Dispatch consumes a current Context Pack; stale index identity refreshes before dispatch
- Context eval suite `npm run eval:context` (CCI1–CCI10)

### Notes

- v0.4.0 is not semantic omniscience. JS/TS is the first concrete extractor; other languages remain extensible
- Context Packs store repository-relative paths, digests, reasons, and confidence — not source copies
- Token estimates use a byte/4 heuristic, not a provider tokenizer
- C5 remains exceptional and approval-gated
- Execution evidence integrity from v0.3.0 is unchanged

### Fixed (Correction 01)

- Incremental index refresh includes clean commit-to-commit name-status, not only dirty porcelain
- Dirty identity hashes changed file bytes so same-status rewrites are not treated as current
- No-Git indexes are revalidated against content digests instead of reused indefinitely
- Unresolved references are carried for unchanged sources and bound to `sourceDigest`
- Discovery truncation is explicit (`complete`/`truncated`) and blocks impact, Context Packs, and dispatch
- Graph emits conservative `interface-reference`, `manifest-reference`, `configures`, `documents`, and JS/TS export boundaries
- Context eval suite `npm run eval:context` now covers CCI1–CCI16

### Fixed (Correction 02)

- JS/TS extraction masks comments, strings, and template text so fake import/require syntax cannot create graph edges
- Computed `import(expr)` detection is stateless per file and no longer depends on regex `lastIndex`
- Export-boundary detection uses the same lexical mask; template/comment/string `export` text is ignored
- Impact traversal includes reverse `documents` / `configures` / `manifest-reference` from C2 upward without widening C1
- Context eval suite `npm run eval:context` now covers CCI1–CCI19

## [0.3.0] - 2026-08-29

### Added

- Bounded execution engine: durable execution runs, compact execution packets, change-digest binding, evidence ledger, independent assurance records, correction loop, and `uads finalize`
- CLI: `uads dispatch`, `uads verify`, `uads evidence record`, `uads assurance start`, `uads assurance record`, `uads finalize`, `uads context expand`
- `uads status` / `uads resume` report active execution phase, digest, pending/failed gates, and reviewers
- Execution schemas 0.3.0: execution-run, execution-packet, evidence-record, review-record
- Canonical agent definitions for requirements-engineer, software-architect, implementation-planner, and test-engineer
- Execution eval suite `npm run eval:execution` (X1–X9)
- Review ZIP includes sanitized orchestration/execution metadata when present

### Notes

- The TypeScript kernel remains provider-neutral and does not edit customer projects or call model APIs
- Dirty worktrees block dispatch; UADS does not reset, stash, or delete user files
- Evidence and reviews bind to the current change digest; stale digest records cannot finalize
- `uads dispatch --session` binds the authoritative implementer session before review; reviewers cannot invent it
- Command gates require command + exit 0 + captured output digest; review gates require reviewer records
- Current-digest FAIL/BLOCKED evidence is sticky until a new change digest
- Change digest hashes actual file bytes, including untracked binaries; Git status is parsed as NUL-delimited porcelain
- Corrupt authoritative evidence/review JSON fails closed
- `uads review` remains review ZIP generation; assurance uses `uads assurance *`

### Fixed (Correction 01)

- Change digest hashes actual bytes of every changed regular file, including same-size untracked binaries
- Git changed-path parsing uses `git status --porcelain=v1 -z -uall`
- Implementer session is required at dispatch and cannot be backfilled during assurance
- `uads assurance record` requires review phase after `uads assurance start`
- Gate evidence contracts reject summary-only or wrong-kind PASS records
- Current-digest FAIL/BLOCKED remains blocking until a new digest
- Active execution artifacts are cross-checked; corrupt evidence/review JSON fails closed

### Fixed (Correction 02)

- Removed the Vitest wrapper that reclassified a non-zero runner exit as PASS
- Test status is fail-closed: Vitest process exit code is the only PASS/FAIL authority
- Upgraded the test runner to stable Vitest 4.1.x so the `onTaskUpdate` RPC timeout no longer occurs

## [0.2.0] - 2026-08-29

### Added

- Orchestrator kernel: structured intake, repository inspect/cache, scope/risk/domain routing, specialist and gate selection, context radius, provider-neutral token budgets
- CLI: `uads inspect`, `uads plan --request` (fallback classifier), `uads plan --intake`, `uads resume`; `uads status` now reports Work Order/phase/risk/gates
- Sidecar artifacts: Work Orders, routing decisions, checkpoints, context plan, repository-map cache under `~/.uads/workspaces/<id>/`
- JSON schemas: intake, routing-decision; Work Order and checkpoint advanced to 0.2.0
- Orchestrator Skill progressive disclosure (`references/`) and Agent Skills compatibility preflight
- Canonical `agents/uads-*.md` plus Cursor user-level adapter (tests use isolated HOME)
- Routing eval suite `npm run eval:orchestrator` (E1–E8 + negative routing)

### Fixed (Correction 01)

- Persist orchestration state through a single secret-safe text boundary before sidecar writes
- Require operational Work Order, routing-decision, and checkpoint fields as authoritative schema state
- CRITICAL/architectural context radius now precedes HIGH/cross-cutting (C4, never default C5)
- Context candidates follow radius semantics instead of appending every mapped module
- Canonical gate registry includes dependency-audit, architecture-conformance, and release-check
- Risk uses task-relevant repository signals only; inspector adds cheap database/migration/Web3 and relative agent/skill locations

### Notes

- The kernel plans and persists; it does not execute arbitrary customer-project edits or call provider APIs
- C5 repository-wide context is not the default; implementer is never the sole reviewer

## [0.1.0] - 2026-08-29

### Added

- Public repository foundation for Universal Autonomous Development Studio
- Apache License 2.0, NOTICE, and OSS governance documents
- Architecture Freeze v0.2 documentation set under `docs/`
- Minimal CLI: `uads --help`, `uads doctor`, `uads status`, `uads review`
- Global-first install scripts (`scripts/install/install.sh`, `install.ps1`)
- Sidecar workspace under `~/.uads/workspaces/<project-id>/`
- Review ZIP generator with SHA-256 checksum and secret/heavy-path exclusion
- JSON schemas for checkpoint, work order, evidence, review, project profile, repository map
- Agent Skill entrypoint `skills/uads-orchestrator/SKILL.md`
- Foundation tests, validation script, and GitHub Actions CI

### Fixed (Correction 01)

- Review ZIP now captures sidecar validation evidence (`evidence/`)
- Layered secret sanitization for remotes, diffs, source, and evidence (defense-in-depth)
- Privacy-minimized shareable manifests (no absolute host paths)
- Global installer installs a usable `uads` CLI via npm prefix
- `npm run lint` documented as TypeScript `tsc --noEmit`, not ESLint
- `npm audit` captured as evidence; production high/critical findings are blocking
- Upgraded Vitest to 3.2.7 so `npm audit` reports 0 vulnerabilities
### Fixed (Correction 02)

- Host-path sanitization covers Windows drive paths (both slash styles), UNC paths, and Unix homes
- Ordinary source such as `src/lib/secrets.ts` is included in review ZIPs; only sensitive data files are excluded by name
- Review ZIP SHA-256 is computed only after inspecting the delivered bytes
- Inspector validates `schemas/review-manifest.schema.json` with Ajv, rejects unsafe/duplicate ZIP paths, and scans for host paths and high-confidence secrets
- Child processes run with `shell: false`; npm is invoked via `npm-cli.js`
- Review ZIP writing uses `adm-zip` only; `archiver` was removed to drop deprecated `glob@10`
- Installer verifies the CLI via `node …/dist/cli.js` on both Windows and Unix npm prefix layouts
