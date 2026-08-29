# 06 — Context and cost intelligence

Token cost is an architectural concern, not a prompt-tuning afterthought.

## Context routing

The orchestrator (future) must send only the context required by the current scope class. Default is **deny-wide, allow-narrow**.

## Repository map

`schemas/repository-map.schema.json` describes modules, entrypoints, and dependency edges. The map is derived from the project and **cached in the sidecar**, not stored in git.

## Dependency / impact map

Before cross-cutting edits, compute which modules are likely affected. Use that set as the context radius, then widen only on evidence of missing references.

## Token budget manager

Each work order may declare `tokenBudget.softLimit` / `hardLimit`. Crossing the hard limit is a stop condition: summarize, checkpoint, and continue in a new turn with cached artifacts.

## Cache-first prompt architecture

1. Prefer sidecar caches (repo map, prior evidence, condensed summaries) over re-reading the entire tree.
2. Hash inputs to derived artifacts; reuse when unchanged.
3. Never put cache files in the project by default.

## Model routing

Route cheap/fast models to classification and lookup; reserve stronger models for architectural synthesis and security-sensitive review. Prompt 001 documents the policy; it does not implement a provider matrix.
