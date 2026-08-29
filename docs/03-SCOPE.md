# 03 — Scope

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
