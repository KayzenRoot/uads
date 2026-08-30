# 06 — Context and cost intelligence

Token cost is an architectural concern, not a prompt-tuning afterthought.

## Context routing

The kernel selects the smallest sufficient radius (C0–C5). Severity is monotonic: CRITICAL or architectural → C4; HIGH or cross-cutting → C3; local → C2; trivial → C1. C5 is exceptional, not default.

## Incremental index

`uads index` builds or incrementally refreshes repository intelligence in the sidecar. Reuse requires matching Git HEAD **and** a content-aware dirty digest (porcelain plus file bytes), not porcelain text alone. Clean checkouts that move HEAD still merge `git diff --name-status` between the persisted and current commits; unreachable previous HEAD fails closed into a full rebuild. No-Git indexes are never treated as current without revalidation. Discovery is not silently truncated: hitting an injectable file/depth bound marks `complete: false` and blocks impact, Context Packs, and dispatch. JS/TS is the first concrete extractor; conservative `configures`, `documents`, `interface-reference`, and `manifest-reference` edges are emitted from explicit paths only. v0.4.0 is not semantic omniscience.

## Impact and Context Packs

`uads impact` and `uads context pack` produce metadata-first artifacts: repository-relative paths, digests, relation, reason, confidence, and a byte-heuristic token estimate. They do not copy source into the sidecar. Graph traversal enforces radius. `uads context expand --reason ...` moves one level, refreshes impact/pack, and never widens product scope. C5 remains exceptional (`--approve-c5`).

## Token budget manager

Each Work Order declares provider-neutral `tokenBudget` with capability class `economy | balanced | strong | critical`. Crossing the hard limit is a stop condition. Pack token estimates are labeled `byte-heuristic` unless a provider tokenizer exists.

## Cache-first prompt architecture

Context Packs layer static policy references, semi-stable contracts, then dynamic Work Order items so future prompt adapters can cache. Provider prompt caching is not implemented in v0.4.0.

## Model routing

Capability class is selected from risk/scope. The kernel does not hard-code vendor prices or call model APIs.
