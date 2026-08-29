# 06 — Context and cost intelligence

Token cost is an architectural concern, not a prompt-tuning afterthought.

## Context routing

The kernel selects the smallest sufficient radius (C0–C5). Severity is monotonic: CRITICAL or architectural → C4; HIGH or cross-cutting → C3; local → C2; trivial → C1. C5 is exceptional, not default. Candidate areas are radius-bounded from intake + the compact repository map; C1 does not append every module.

## Repository map

`uads inspect` writes a compact map to the sidecar (`index/repository-map.json`). It walks metadata and a bounded file sample, skips secrets and heavy dirs, and reuses the cache when HEAD, dirty digest, and key manifests are unchanged.

## Dependency / impact map

Execution packets stay metadata-first: Work Order, checkpoint, compact map, context candidates, then source. If the planned radius is insufficient, expand one step (`uads context expand --reason ...`). Never jump C1→C5. C5 remains exceptional (`--approve-c5`). Expansion does not widen product scope.

## Token budget manager

Each Work Order declares provider-neutral `tokenBudget` with capability class `economy | balanced | strong | critical`. Crossing the hard limit is a stop condition. Adapters may later map classes to models; the kernel does not hard-code vendor prices.

## Cache-first prompt architecture

1. Prefer checkpoint, repository map, and prior decisions over re-reading the tree.
2. Hash inputs to derived artifacts; reuse when unchanged.
3. Never put cache files in the project by default.

## Model routing

Capability class is selected from risk/scope. Prompt 002 does not implement a provider matrix.
