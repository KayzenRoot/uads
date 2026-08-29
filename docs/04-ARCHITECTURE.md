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

## Logical modules (future implementation in `core/`)

| Module | Responsibility |
| --- | --- |
| orchestration | Work-order lifecycle |
| routing | Model and skill routing |
| context | Context packing and radius |
| cost | Token budget manager |
| risk | Change-risk classification |
| gates | Quality/security/performance gates |
| evidence | Evidence protocol |
| state | Checkpoints and sidecar profile |

Foundation CLI lives in `src/` and already implements fingerprint, sidecar paths, and review packaging.

## Global layout

```
~/.uads/
  core/
  skills/
  agents/
  workspaces/
    <project-id>/
      profile.json
      state/
      reviews/
```

`project-id` is the first 16 hex chars of SHA-256 over the normalized git origin URL, or the repo path if no origin exists.

## Adapters

- `adapters/cursor` — Cursor / Agent Skills
- `adapters/codex` — Codex-compatible invocation
- `adapters/generic` — any agent that can read `SKILL.md` and run the CLI

## Data flow (foundation)

```
cwd → git root → fingerprint → sidecar workspace
                              → doctor/status
                              → review ZIP + sha256
```

## Freeze status

v0.2 is frozen for Prompt 001. Breaking these defaults requires a documented freeze bump.
