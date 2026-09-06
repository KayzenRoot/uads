# Work Order — `ENG-PROMPT-012-HOST-EXECUTION-IMPLEMENTATION-001`

Status: `READY_FOR_REVIEW`
Repository: `KayzenRoot/uads`
Branch: `feat/eng-prompt-012-host-execution-implementation-001`
Baseline Git SHA: `c8ce23e7797ff158772128fc8ed97ffbab056b4f`
Head Git SHA: `pending; authoritative PR head must be read from GitHub`
Scope class: `architectural`
Risk: `HIGH`

## Objective

Implement the single Prompt 012 capability authorized by the accepted parent
scope freeze: a bounded, provider-neutral Host Execution handoff and Receipt
Boundary after a current Host Dispatch Bundle. The implementation must accept
only revalidated identity-bound sidecar state, record bounded host outcome
facts, preserve Architecture Freeze v0.2, and remain unmerged until an
independent audit approves the exact PR head.

## Parent scope and context lock

- Parent scope Work Order: `ENG-PROMPT-012-HOST-EXECUTION-BOUNDARY-001`.
- Parent scope was accepted and promoted on main
  `c8ce23e7797ff158772128fc8ed97ffbab056b4f` with tree
  `4818ba203b241191afba43ff92ded3a6f3d2781d`.
- Context Lock: `.engineering/context-locks/PROMPT-012-HOST-EXECUTION-IMPLEMENTATION-001.md`.
- Implementation must not broaden Architecture Freeze v0.2 or rewrite the
  accepted parent records.

## Included scope

- A strict `uads.host-execution-receipt` v0.1.0 schema and closed reason-code
  set binding bundle, adapter, project, Work Order, routing, specialist,
  model/runtime, execution-run, target-root, change, timestamps, and digest.
- One handoff seam for Cursor, Codex, and Generic Agent Skills that rechecks
  current orchestration state, ownership, target root, capabilities, and
  execution identity before `ACCEPTED`.
- The closed receipt state machine: `ACCEPTED`, `STARTED`, `COMPLETED`,
  `FAILED`, and `BLOCKED`, with immutable terminal facts and idempotent replay
  reads.
- Global sidecar-only atomic persistence at
  `workspaces/<project-id>/host-execution/`, current pointer, immutable
  bounded history, safe identifiers, corruption rejection, and 32-entry
  retention.
- `uads adapters handoff <adapter>` and
  `uads adapters receipt <adapter> --state <state>` JSON/human surfaces with
  no raw operational data.
- HEB01–HEB20 focused tests, host-execution eval registration, schema flow,
  adapter compatibility coverage, and bounded documentation updates.
- Local and hosted evidence needed to return `READY_FOR_REVIEW`.

## Explicitly out of scope

- Provider API clients, provider endpoints, credentials, tokens, model
  invocation, provider catalogs, network calls, or provider gateway behavior.
- `child_process`, shell, arbitrary host command execution, command text,
  environment dumps, raw prompts, model output, or autonomous approval.
- Project-local operational files, migration of historical state, release/tag
  mutation, package version changes, dependencies, deployment, dashboard,
  marketplace, UGAS expansion, or broader specialist catalog work.
- Changes to existing gate evidence, assurance semantics, review authority,
  release security proof, action pins, compatibility workflow, or Prompt 011
  history.
- Merge, promotion of canonical product truth, or release publication.

## Dependencies and assumptions

- Accepted parent scope freeze and final main baseline remain unchanged.
- Existing `Host Dispatch Bundle`, model, specialist, execution, ownership,
  atomic-write, schema, and privacy contracts remain authoritative.
- Host owns actual IDE/agent/provider invocation; UADS receives only the
  schema-defined outcome transition.
- The implementation Work Order is the only new implementation authority;
  its checkpoint delta remains review-pending until maintainer action.

## Acceptance criteria

- [ ] HEB01–HEB20 pass on the exact implementation source.
- [ ] Handoff fails closed for missing/corrupt/tampered/stale/replayed,
      cross-project, wrong-adapter, cross-root, unsupported, blocked, and
      mismatched identities.
- [ ] A non-null current `executionRunId` is required and bound to the
      current run before `ACCEPTED`.
- [ ] Receipt state, transition, timestamp, reason-code, digest, and
      immutable-history rules are schema-closed and tested.
- [ ] Sidecar persistence is atomic, global-only, safe, privacy-minimized,
      corruption-aware, and bounded at 32 history entries.
- [ ] Cursor, Codex, and Generic Agent Skills use the same contract and never
      fabricate unproven subagent, parallel, provider, or model capability.
- [ ] A completed receipt cannot satisfy evidence, gates, assurance, review,
      finalize, release, or deployment authority.
- [ ] Existing adapter lifecycle behavior and the full pre-existing validation
      matrix remain passing; total existing tests do not decrease from 48 files
      and 354 tests.
- [ ] Independent audit approves the exact PR head; the PR remains unmerged.

## Required gates and evidence

- Local: `git diff --check`, `npm ci`, `npm run validate:engineering`,
  `npm run lint`, `npm run typecheck`, `npm test`, all existing evals,
  `npm run eval:host-execution`, `npm run validate`, and
  `npm audit --audit-level=high`.
- Focused: `npm run eval:host-execution` with HEB01–HEB20 and direct schema,
  privacy, ZPF, replay, transition, and adapter lifecycle assertions.
- Hosted: exact-head Foundation, CodeQL, Dependency Review, Linux Node 20,
  Windows Node 20, and required direct-review/security proof checks.
- Evidence Bundle:
  `.engineering/reports/EVIDENCE-BUNDLE-PROMPT-012-HOST-EXECUTION-IMPLEMENTATION-001.md`.

## Stop conditions

- Baseline SHA/tree differs from the Context Lock or parent scope changes.
- Any provider, credential, network, arbitrary-command, project-local, or
  approval-authority requirement enters the implementation.
- Architecture Freeze v0.2 must be bumped, another implementation PR exists,
  or an unresolved HIGH/CRITICAL issue remains.
- Any required local/hosted check is missing or fails; privacy/ZPF or identity
  proof is incomplete; version, tags, releases, or dependencies change.
- The implementation is merged or released before independent audit approval.

## Autonomy boundary

- Safe autonomous actions: inspect the locked repository, make bounded
  in-scope edits, add tests/schema/docs/evidence, run local validation, create
  the requested branch/commit/PR, and collect read-only hosted checks.
- Requires maintainer/owner action: independent approval, canonical checkpoint
  promotion, merge, release, tag mutation, or any scope/freeze decision.

## Review and delivery

- Independent reviewer: repository maintainer / independent technical audit.
- PR title: `feat(ENG-PROMPT-012-HOST-EXECUTION-IMPLEMENTATION-001): add bounded host execution receipts`.
- Evidence Bundle:
  `.engineering/reports/EVIDENCE-BUNDLE-PROMPT-012-HOST-EXECUTION-IMPLEMENTATION-001.md`.
- Checkpoint Delta:
  `.engineering/checkpoints/CHECKPOINT-DELTA-PROMPT-012-HOST-EXECUTION-IMPLEMENTATION-001.md`.
- Final delivery status is `READY_FOR_REVIEW`; do not merge or release.
