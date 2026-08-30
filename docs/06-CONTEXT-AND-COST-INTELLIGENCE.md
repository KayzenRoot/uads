# 06 — Context and cost intelligence

Token cost is an architectural concern, not a prompt-tuning afterthought.

## Context routing

The kernel selects the smallest sufficient radius (C0–C5). Severity is monotonic: CRITICAL or architectural → C4; HIGH or cross-cutting → C3; local → C2; trivial → C1. C5 is exceptional, not default.

## Incremental index

`uads index` builds or incrementally refreshes repository intelligence in the sidecar. Reuse requires matching Git HEAD **and** a content-aware dirty digest (porcelain plus file bytes), not porcelain text alone. Clean checkouts that move HEAD still merge `git diff --name-status` between the persisted and current commits; unreachable previous HEAD fails closed into a full rebuild. No-Git indexes are never treated as current without revalidation. Discovery is not silently truncated: hitting an injectable file/depth bound marks `complete: false` and blocks impact, Context Packs, and dispatch. JS/TS extraction is lexically conservative: import/require/export syntax inside comments, strings, and template text is not treated as executable evidence, while `${ ... }` interpolations remain visible. Conservative `configures`, `documents`, `interface-reference`, and `manifest-reference` edges are emitted from explicit paths only. v0.4.0 is not semantic omniscience.

## Impact and Context Packs

`uads impact` and `uads context pack` produce metadata-first artifacts: repository-relative paths, digests, relation, reason, confidence, and a byte-heuristic token estimate. They do not copy source into the sidecar. Graph traversal enforces radius. Incoming `documents` / `configures` / `manifest-reference` edges contribute documentation or config context from C2 upward with edge-derived reasons; C1 stays named-files only. `uads context expand --reason ...` moves one level, refreshes impact/pack, and never widens product scope. C5 remains exceptional (`--approve-c5`).

## Token budget manager

Each Work Order declares provider-neutral `tokenBudget` with capability class `economy | balanced | strong | critical`. Crossing the hard limit is a stop condition. Pack token estimates are labeled `byte-heuristic` unless a provider tokenizer exists.

## Cache-first prompt architecture

Context Packs layer static policy references, semi-stable contracts, then dynamic Work Order items so future prompt adapters can cache. Provider prompt caching is not implemented in v0.5.0.

## Fault localization

When verification fails, UADS normalizes evidence, computes a deterministic signature, ranks hypotheses, and emits the smallest sufficient diagnostic Context Pack. Ranking is heuristic, not calibrated probability. Diagnosis is not verified root cause; ranked candidates stay hypotheses. `verifiedRootCausePaths` stays empty unless independently proven. Verified correction is recorded only when the Failure Record is bound to the completed corrective execution, that run's current change digest, passing gates, and independent review. A stored execution digest is not enough if the live worktree has changed: stale failure recording is rejected until `uads verify` re-establishes coherence, and explicit resolution is refused unless the live canonical digest still equals the verified corrective digest. Failure evidence and verified memory cannot cross code-state boundaries. Compact Failure Memory is reusable only when the **post-correction** candidate/dependency validity basis still matches a complete current index; otherwise it is historical/advisory. Loop detection counts distinct failure observations with the same signature and the same content-aware change identity, not repeated `uads diagnose` on one record. Diagnostic expansion is one radius step and never jumps to C5.

## Model routing

Capability class is selected from risk/scope. The kernel does not hard-code vendor prices or call model APIs.
