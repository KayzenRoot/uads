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

## Correction 01 — Current-Identity & Approval-Boundary Enforcement

The independent audit identified two HIGH findings on PR #19 head
`00aab691814486fe8ee3c608a98a2c5dc10a94c8` / tree
`acef397ce681eee2ee3ceb52a33884a0654d1669`: mutating transitions trusted an
unchanged persisted bundle after current orchestration drift, and handoff did
not enforce `autonomyBoundary.requiresApproval`. This correction keeps the
same Work Order, branch, PR, architecture freeze, and release boundary.

The correction reconstructs current Host Dispatch artifacts before every
mutating transition and fails closed on execution-run, Work Order/routing,
specialist, model/runtime, current-change, adapter ownership, target-root, or
semantic bundle drift. The current architecture has no durable authorization
proof primitive; therefore a non-empty active approval classification is
rejected at handoff with the schema-closed
`APPROVAL_AUTHORIZATION_MISSING` reason. The global `requiresApproval` catalog
is not current-action evidence. No receipt, CLI flag, or prose is treated as
approval.

## Correction 02 — Active Approval Intent Classification

The follow-up audit identified that Correction 01 enforced the global
`autonomyBoundary.requiresApproval` policy catalog as though it were evidence
that the current handoff requested an approval-gated action. Because the
planner intentionally retains the bounded catalog on ordinary Work Orders,
that implementation blocked safe local handoffs and the old fixture concealed
the defect by rewriting the catalog to an empty list.

Correction 02 preserves the same Work Order, branch, PR #19, Architecture
Freeze v0.2, version/package identity, and release boundary. It adds the
deterministic schema-closed `activeApprovalGatedActions` projection, derived
from canonical objective, scope, and domain/risk/destructive planning signals.
It uses a fixed vocabulary of eight approval classes, binds the projection to
the Work Order routing digest and Host Dispatch Bundle identity, and enforces
only a non-empty active projection. Sensitive intent that cannot prove a fixed
class is marked `activeApprovalIntentAmbiguous` and fails closed for that task.
The global catalog remains intact.

Production deployment (including promotion to production), destructive
production database operations, explicit material-cost external infrastructure actions, real credential rotation,
destructive Git history rewrites, unauthorized package/release publication,
asset/fund transfers, and on-chain transaction execution fail closed with
`APPROVAL_AUTHORIZATION_MISSING`. Ambiguous or caller-supplied boolean intent
does not authorize a handoff; no external approval provider or service is
introduced. `approvedBoundaries` is only a planning signal and cannot create
positive authorization proof; Host Dispatch recomputes the projection from the
current Work Order's persisted objective, scope, requested artifacts, and
destructive/domain/risk signals and fails closed when the
persisted projection disagrees. Old sidecars remain readable conservatively,
while stale bundles without the active projection cannot authorize mutation.

## Acceptance criteria

- [x] HEB01–HEB20, HEB21–HEB27, and HEB28–HEB43 pass on the exact implementation source.
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
- [ ] Every mutating receipt transition revalidates current authority rather
      than trusting receipt-plus-old-bundle equality; drift leaves the prior
      receipt unchanged.
- [ ] Safe planner-generated work remains handoffable with the global
      `requiresApproval` catalog intact and an empty active classification.
- [ ] Active approval-gated handoff fails closed with
      `APPROVAL_AUTHORIZATION_MISSING` when no exact durable authorization proof
      exists, and completed receipts cannot substitute for approval.
- [ ] Active approval classification is fixed-vocabulary, planner-derived,
      digest-bound, recomputed at Host Dispatch from all persisted canonical
      action signals, tamper-resistant, fails closed
      when sensitive intent is ambiguous, and is not bypassable by caller
      booleans, prose boundaries, or receipt state.
- [ ] Existing adapter lifecycle behavior and the full pre-existing validation
      matrix remain passing; total existing tests do not decrease from 48 files
      and 354 tests.
- [ ] Independent audit approves the exact PR head; the PR remains unmerged.

## Required gates and evidence

- Local: `git diff --check`, `npm ci`, `npm run validate:engineering`,
  `npm run lint`, `npm run typecheck`, `npm test`, all existing evals,
  `npm run eval:host-execution`, `npm run validate`, and
  `npm audit --audit-level=high`.
- Focused: `npm run eval:host-execution` with HEB01–HEB27 and direct schema,
  privacy, ZPF, replay, current-identity, approval, transition, and adapter
  lifecycle assertions.
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
