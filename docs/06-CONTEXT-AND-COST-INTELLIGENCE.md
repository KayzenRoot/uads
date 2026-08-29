# 06 — Context and cost intelligence

Token cost is an architectural concern, not a prompt-tuning afterthought.

## Context routing

The kernel selects the smallest sufficient radius (C0–C5). C5 is exceptional, not default. The host may expand one level when evidence shows missing context.

## Repository map

`uads inspect` writes a compact map to the sidecar (`index/repository-map.json`). It walks metadata and a bounded file sample, skips secrets and heavy dirs, and reuses the cache when HEAD, dirty digest, and key manifests are unchanged.

## Dependency / impact map

Before cross-cutting edits, use repository-map modules plus intake `affectedAreas` as the candidate set. Widen only on evidence of missing references.

## Token budget manager

Each Work Order declares provider-neutral `tokenBudget` with capability class `economy | balanced | strong | critical`. Crossing the hard limit is a stop condition. Adapters may later map classes to models; the kernel does not hard-code vendor prices.

## Cache-first prompt architecture

1. Prefer checkpoint, repository map, and prior decisions over re-reading the tree.
2. Hash inputs to derived artifacts; reuse when unchanged.
3. Never put cache files in the project by default.

## Model routing

Capability class is selected from risk/scope. Prompt 002 does not implement a provider matrix.
