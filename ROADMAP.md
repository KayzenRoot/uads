# Roadmap

UADS by NexLabs. Staged implementation.

## Prompt 001 — Foundation (complete)

Repository governance, Architecture Freeze v0.2 docs, minimal CLI (`help`, `doctor`, `status`, `review`), global install, Agent Skill entrypoint, schemas, tests, CI, privacy-minimized review ZIP.

## Prompt 002 — Orchestrator Kernel (complete)

Deterministic planning kernel: intake, repository map, scope/risk/domain/specialist/gates/context/budget, Work Order + routing decision + checkpoint, `inspect`/`plan`/`status`/`resume`, evals, Cursor `uads-*` adapter.

## Prompt 003 — Bounded Execution Engine (complete)

Dispatch, change digest, evidence ledger, independent assurance, correction loop, finalize guards, execution evals X1–X9. Correction 01 hardens digest, session identity, assurance ordering, gate contracts, sticky failures, and fail-closed corrupt state. Host performs edits; kernel stays provider-neutral.

## Prompt 004 — Context Intelligence (complete)

Incremental sidecar index, JS/TS dependency graph with evidence/confidence, test and conservative interface maps, impact reports, metadata-first Context Packs, C0–C5 graph enforcement, `uads index` / `impact` / `context pack`, context evals CCI1–CCI19. Correction 01 hardens commit-to-commit freshness, dirty content identity, no-Git revalidation, unresolved reuse, truncation fail-closed, and conservative relationship classes. Correction 02 hardens lexical extraction and reverse docs/config impact.

## Prompt 005 — Fault localization and Failure Memory (complete)

Normalized failure records, deterministic signatures, ranked hypotheses, diagnostic Context Packs, compact Failure Memory with post-correction validity/loop detection, CLI `failure`/`diagnose`/`failures`, fault evals FL1–FL18. C5 remains exceptional. Diagnosis is not verified root cause. Repeated diagnosis is not a repeated failure. Failure evidence and verified memory cannot cross code-state boundaries.

## Prompt 006 — Evidence Cache, Cost Governor & Token Economics (complete)

Deterministic evidence reuse with content-aware validity, conservative gate policy, operational soft/hard token budgets, provider-neutral QPT snapshot, CLI `cache`/`cost`, and cost evals CC1–CC14. Reuse never skips a required non-reusable gate. Architecture Freeze v0.2 NECESSARY subsystem; precedes provider/model routing.

## Next increments (planned)

1. Broader specialist catalog (still not a marketplace) — FUTURE; the bounded
   Prompt 009 catalog is sufficient for current routing and the complete 30+
   catalog remains explicitly deferred.
2. Provider adapters mapping capability classes to models — FUTURE for live
   provider-specific adapters; the provider-neutral capability/profile mapping
   and host-managed compatibility needed by the current contract are already
   delivered by Prompt 008.
3. Cursor adapter depth + generic/Codex execution — **selected as the sole
   Prompt 012 capability**, limited to the host execution/receipt boundary
   after the already delivered dispatch-bundle preparation.
4. UGAS integration (reserved under `integrations/ugas/`)

## Prompt 012 — Scope freeze (planning only)

Prompt 012 freezes exactly one next capability for a later implementation
increment: a bounded, provider-neutral host execution and receipt boundary
for an already validated Host Dispatch Bundle. This is a planning decision,
not an implementation claim. The current release remains `0.11.1` and the
current host adapters still stop at sidecar-only preparation.

The selection is NECESSARY for the staged adapter-depth roadmap item after
reconciling the two preceding items against the pre-freeze repository state.
Prompt 009 already delivers the bounded specialist registry, while Prompt 008
already delivers provider-neutral capability/profile mapping and explicit
host-managed compatibility; live provider adapters are not a prerequisite
because provider invocation remains host-owned and out of scope. The current
product can prepare an identity-bound handoff but cannot yet execute that
handoff through an ownership-safe host boundary or record a bounded
completion/failure receipt. The selected capability must preserve
global-first state, zero project footprint, provider neutrality, explicit
approval ownership, and fail-closed identity checks.

UGAS integration is not a prerequisite for the staged adapter-depth work and
remains FUTURE; deep UGAS work is excluded from Prompt 012. Provider gateways,
dashboards, marketplaces, deployment automation, and other expansions remain
excluded.

The frozen Work Order is
`ENG-PROMPT-012-HOST-EXECUTION-BOUNDARY-001`; implementation must not begin
until its independent review is complete.

## Explicitly later

Marketplace, dashboard, cloud control plane, enterprise server, production third-party Skill registry, embeddings.

See `docs/14-BACKLOG.md`.
