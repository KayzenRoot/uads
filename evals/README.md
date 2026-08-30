# Orchestrator and execution evals

Machine-readable cases for:

- `npm run eval:orchestrator` — routing selections E1–E8 + negative routing
- `npm run eval:execution` — lifecycle X1–X9 (happy path, fail verify, missing review, self-review, scope violation, correction loop, CRITICAL assurance, evidence spoof, digest/session integrity)
- `npm run eval:context` — Context Intelligence CCI1–CCI19 (local pack, shared utility, incremental reuse, delete/rename, cycles, radius, C5, unsafe paths, privacy, stale identity, commit refresh, dirty content, no-git freshness, unresolved preservation, truncated index, relationship classes, lexical false positives, computed-import determinism, reverse docs/config impact)
- `npm run eval:fault` — Fault localization FL1–FL10 (direct stack, failing-test mapping, related diff, shared utility, unrelated subsystem, ambiguity, loop, valid memory reuse, stale memory, secret-safe persist)

Each JSON file is deterministic and local. No provider/model/network API calls.

UADS by NexLabs.
