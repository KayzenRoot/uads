# 03 — Scope

## In scope (Prompt 006)

- Evidence Cache with deterministic validity basis, conservative gate reuse policy, and explainable decisions
- Cache population from authoritative PASS only; derived cache-reuse evidence on the current digest
- Cost Governor allow/warn/block/reuse decisions and operational soft/hard token budgets
- Provider-neutral QPT snapshot with a documented heuristic formula
- CLI: `cache status`, `cache explain`, `cost status`, `cost explain`
- Cost evals CC1–CC14

## In scope (Prompt 005)

- Normalized failure records, deterministic signatures, and secret-safe persist
- Fault ranking from stack, failing tests, related diffs, Test Map, dependency graph, and Interface Map
- Diagnostic Context Packs (metadata-first, radius-bound; C5 remains exceptional)
- Compact per-project Failure Memory with validity/invalidation and loop detection
- CLI: `failure record`, `diagnose`, `failures`, `failure show`
- Fault evals FL1–FL18

## In scope (Prompt 004, preserved)

- Incremental sidecar index, JS/TS graph, test/interface maps, impact reports, Context Packs
- CLI: `index`, `impact`, `context pack`, one-level `context expand`

## In scope (Prompt 003)

- Bounded execution lifecycle: dispatch, implement, verify, independent review, finalize
- Change digest binding, evidence ledger, assurance records, correction loop
- CLI: `dispatch`, `verify`, `evidence record`, `assurance start/record`, `finalize`, `context expand`
- Core agent definitions for currently selectable host-invokable specialists
- Execution evals X1–X7; existing orchestrator evals remain green

## In scope (Prompt 002, preserved)

- Deterministic orchestrator kernel: intake, inspect, scope, risk, domain, specialist, gates, context, token budget
- Sidecar Work Orders, routing decisions, checkpoints, repository-map cache
- CLI: `inspect`, `plan --request` (fallback), `plan --intake`, `status`, `resume`
- Cursor user-level `uads-*` adapter (isolated HOME in tests)

## Out of scope (Prompt 005)

- Provider/model diagnosis, embeddings, vector DB
- Rich failure analytics dashboards
- 30+ specialist catalog, marketplace, deep UGAS integration
- AST-for-all languages, network calls from the kernel

## Out of scope (Prompt 003)

- Semantic dependency/impact graph and embeddings
- Provider API clients and hard-coded model price tables
- Complete 30+ department specialist catalog
- Marketplace, dashboard, cloud control plane, enterprise server
- Deep UGAS integration
- Autonomous production deployment, wallet custody, on-chain execution
- Project-local UADS operational state

## Scope classification (runtime)

Every Work Order is classified before expansion:

- `trivial` — isolated wording or presentation
- `local` — one module
- `cross-cutting` — several modules, tests required
- `architectural` — public contracts, core architecture, storage/auth architecture

Only **NECESSARY** work enters the current Work Order. IMPORTANT/FUTURE items are recommendations. OUT_OF_SCOPE stays excluded. Execution classifies changed paths as in-scope, supporting, out-of-scope, or sensitive.
