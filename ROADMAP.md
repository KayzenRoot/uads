# Roadmap

UADS by NexLabs. Staged implementation.

## Prompt 001 — Foundation (complete)

Repository governance, Architecture Freeze v0.2 docs, minimal CLI (`help`, `doctor`, `status`, `review`), global install, Agent Skill entrypoint, schemas, tests, CI, privacy-minimized review ZIP.

## Prompt 002 — Orchestrator Kernel (current)

Deterministic planning kernel: intake, repository map, scope/risk/domain/specialist/gates/context/budget, Work Order + routing decision + checkpoint, `inspect`/`plan`/`status`/`resume`, evals, Cursor `uads-*` adapter.

## Next increments (planned)

1. Implementation execution engine for in-scope product edits (still bounded by Work Orders)
2. Deeper context packing and impact maps
3. Broader specialist catalog (still not a marketplace)
4. Provider adapters mapping capability classes to models
5. Cursor adapter depth + generic/Codex execution
6. UGAS integration (reserved under `integrations/ugas/`)

## Explicitly later

Marketplace, dashboard, cloud control plane, enterprise server, production third-party Skill registry, embeddings.

See `docs/14-BACKLOG.md`.
