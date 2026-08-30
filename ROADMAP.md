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

Normalized failure records, deterministic signatures, ranked hypotheses, diagnostic Context Packs, compact Failure Memory with validity/loop detection, CLI `failure`/`diagnose`/`failures`, fault evals FL1–FL10. C5 remains exceptional. Diagnosis is not verified root cause.

## Next increments (planned)

1. Broader specialist catalog (still not a marketplace)
2. Provider adapters mapping capability classes to models
3. Cursor adapter depth + generic/Codex execution
4. UGAS integration (reserved under `integrations/ugas/`)

## Explicitly later

Marketplace, dashboard, cloud control plane, enterprise server, production third-party Skill registry, embeddings.

See `docs/14-BACKLOG.md`.
