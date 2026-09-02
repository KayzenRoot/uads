# 04 — Architecture

Architecture Freeze **v0.2** for UADS by NexLabs.

## Principles

1. **Global-first** — UADS internals live under `~/.uads/`, not in each project.
2. **Zero Project Footprint** — no operational cache, work orders, indexes, or reviews in the project by default.
3. **Evidence-first** — completion claims need commands, outputs, or files.
4. **Small foundation** — this increment is a solid base, not a half-built platform.
5. **Open source ready** — clear docs, Apache-2.0.
6. **Security-conscious** — review ZIPs never pack secrets.
7. **Token-aware** — cache-first prompting and context-radius policies.
8. **No scope creep** — extras go to the backlog.
9. **Portable** — CLI and review bundle do not require a proprietary runtime.
10. **Tested** — foundation is not done until validation passes.

## Logical modules

Kernel implementation lives in `src/kernel/` (Prompt 002). `core/` remains reserved READMEs so the published tree does not imply a finished platform.

| Module | Responsibility |
| --- | --- |
| orchestration | Work-order lifecycle through plan, then bounded execution through finalize |
| evidence | Foundation validation evidence plus digest-bound execution evidence |
| routing | Domain/specialist/gate routing (provider-neutral) |
| context | Context radius C0–C5, incremental index, impact graph, metadata-first Context Packs, diagnostic packs |
| failure | Normalized failure records, fault ranking, Failure Memory, loop/escalation |
| cost | Token budget by capability class plus Cost Governor, ledger, and QPT snapshot |
| cache | Evidence Cache validity, reuse policy, and derived current-digest evidence |
| model routing | Provider-neutral Model Profiles, runtime capability intersection, deterministic Model Execution Plans |
| specialist routing | Global Specialist Registry, deterministic coverage/assurance selection, bounded dispatch groups, selection identity and stale-plan guards |
| risk | Structured-signal risk classification |
| gates | Selected quality/security/performance gates |
| state | Atomic sidecar checkpoints, execution runs, and resume packets |

Foundation CLI lives in `src/` and implements fingerprint, sidecar paths, review packaging, and the orchestrator kernel.

## Global layout

```
~/.uads/
  core/
  skills/
  agents/
  adapters/
  cache/
  registry/
    models/profiles.json
    runtime/capabilities/
    specialists/registry.json
    specialists/state.json
  workspaces/
    <project-id>/
      profile.json
      state/current.json
      checkpoints/
      work-orders/
      decisions/
      index/repository-map.json
      index/index-state.json
      index/dependency-graph.json
      context/
        plan.json
        packs/
        impact-reports/
        diagnostic-packs/
      failures/
        memory.json
        current.json
        records/
        diagnoses/
      evidence/
      execution-runs/
        <execution-run-id>/
          run.json
          packet.json
          evidence/
          reviews/
      model-routing/
        current.json
        history/
      specialist-routing/
        current.json
        history/
      reviews/
```

`project-id` is the first 16 hex chars of SHA-256 over the normalized git origin URL, or the repo path if no origin exists.

## Adapters

- `adapters/cursor` — Cursor / Agent Skills; optional user-level `~/.cursor/agents/uads-*`
- `adapters/codex` — Codex-compatible invocation
- `adapters/generic` — any agent that can read `SKILL.md` and run the CLI

## Data flow (Prompt 002)

```
USER REQUEST
  → host Skill semantic intake (or CLI --request fallback)
  → deterministic kernel
  → repository map + scope/risk (task-relevant repo context only)/domain/specialists/gates/context/budget
  → Specialist Selection Plan + Work Order + routing decision + checkpoint + Model Execution Plan (global/sidecar only)
  → uads resume (no full-repo re-ingestion)
```

The Model Execution Plan is computed by capability floor first, then deterministic cost/latency tie-breaking. It carries registry/runtime/policy/change identities and is revalidated before dispatch. No model provider HTTP call is part of this data flow.

The Specialist Selection Plan is computed by deterministic minimum-sufficient coverage first, then stable profile priority and ID tie-breaking. It carries profile-level role assignments, evidence obligations, forbidden scope, and dependency/parallel groups. Implementation and assurance are never dispatched as one parallel group; the current plan is checked against the Work Order and current registry before execution.

## Freeze status

v0.2 architecture freeze remains in force. Prompt 002 implements the kernel inside that freeze; breaking global-first / ZPF defaults requires a documented freeze bump.
