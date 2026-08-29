# 11 — Adapters

UADS is adapter-shaped: the core is portable; hosts bind through a thin layer.

## Cursor

`adapters/cursor/` — Agent Skills (`SKILL.md`) plus CLI for doctor/status/review. Cursor is a first-class execution environment for this repository.

## Codex / generic

`adapters/codex/` and `adapters/generic/` describe the same contract without Cursor-specific UI:

- Read `skills/uads-orchestrator/SKILL.md`
- Honor global-first and zero footprint
- Run `uads` for environment and review artifacts
- Persist checkpoints only in the sidecar (when the orchestrator exists)

## Contract

Adapters must not dump UADS state into the project to “make the host happy.” If a host requires an in-repo file, it is an explicit opt-in and a freeze exception.
