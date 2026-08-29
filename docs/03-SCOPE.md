# 03 — Scope

## In scope (Prompt 002)

- Deterministic orchestrator kernel: intake, inspect, scope, risk, domain, specialist, gates, context, token budget
- Sidecar Work Orders, routing decisions, checkpoints, repository-map cache
- CLI: `inspect`, `plan --request` (fallback), `plan --intake`, `status`, `resume`
- Orchestrator Skill progressive disclosure + Agent Skills preflight
- Cursor user-level `uads-*` adapter (isolated HOME in tests)
- Routing evals E1–E8 and negative-routing assertions

## Out of scope (Prompt 002)

- Arbitrary code-edit execution engine for customer projects
- Provider API clients and hard-coded model price tables
- Complete 30+ department specialist catalog
- Marketplace, dashboard, cloud control plane, enterprise server
- Deep UGAS integration (game-asset generation remains external)
- Embeddings / whole-repository semantic index
- Project-local UADS operational state

## Scope classification (runtime)

Every Work Order is classified before expansion:

- `trivial` — isolated wording or presentation
- `local` — one module
- `cross-cutting` — several modules, tests required
- `architectural` — public contracts, core architecture, storage/auth architecture

Only **NECESSARY** work enters the current Work Order. IMPORTANT/FUTURE items are recommendations. OUT_OF_SCOPE stays excluded.
