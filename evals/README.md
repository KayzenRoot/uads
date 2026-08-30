# Orchestrator and execution evals

Machine-readable cases for:

- `npm run eval:orchestrator` — routing selections E1–E8 + negative routing
- `npm run eval:execution` — lifecycle X1–X9 (happy path, fail verify, missing review, self-review, scope violation, correction loop, CRITICAL assurance, evidence spoof, digest/session integrity)
- `npm run eval:context` — Context Intelligence CCI1–CCI16 (local pack, shared utility, incremental reuse, delete/rename, cycles, radius, C5, unsafe paths, privacy, stale identity, commit refresh, dirty content, no-git freshness, unresolved preservation, truncated index, relationship classes)

Each JSON file is deterministic and local. No provider/model/network API calls.

UADS by NexLabs.
