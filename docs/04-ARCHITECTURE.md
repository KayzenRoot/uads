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
| orchestration | Work-order lifecycle through `plan`; later phases represented but not falsely completed |
| routing | Domain/specialist/gate routing (provider-neutral) |
| context | Context radius C0–C5; default smallest sufficient; C5 exceptional |
| cost | Token budget by capability class: economy / balanced / strong / critical |
| risk | Structured-signal risk classification |
| gates | Selected quality/security/performance gates |
| evidence | Evidence protocol |
| state | Atomic sidecar checkpoints and resume packets |

Foundation CLI lives in `src/` and implements fingerprint, sidecar paths, review packaging, and the orchestrator kernel.

## Global layout

```
~/.uads/
  core/
  skills/
  agents/
  adapters/
  cache/
  workspaces/
    <project-id>/
      profile.json
      state/current.json
      checkpoints/
      work-orders/
      decisions/
      index/repository-map.json
      context/
      evidence/
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
  → repository map + scope/risk/domain/specialists/gates/context/budget
  → Work Order + routing decision + checkpoint (sidecar only)
  → uads resume (no full-repo re-ingestion)
```

## Freeze status

v0.2 architecture freeze remains in force. Prompt 002 implements the kernel inside that freeze; breaking global-first / ZPF defaults requires a documented freeze bump.
