# 11 — Adapters

UADS is adapter-shaped: the core is portable; hosts bind through a thin layer.

## Cursor

Canonical specialist markdown lives in the UADS package `agents/` directory and is copied to `~/.uads/agents/`.

The Cursor adapter may also install managed `uads-*` files under the **user-level** Cursor agents directory (`~/.cursor/agents/` or `$CURSOR_USER_HOME/.cursor/agents/`). It does not write project-level `.cursor/agents`. Unrelated user agent files are left untouched. Adapter install failure is reported and must not corrupt the canonical UADS copy.

Invoke `skills/uads-orchestrator/SKILL.md` plus the CLI (`inspect`, `plan`, `dispatch`, `verify`, `evidence`, `assurance`, `finalize`, `status`, `resume`, `review`). Codex/generic adapters use the same Skill + CLI contract without Cursor-specific paths.


## Codex / generic

`adapters/codex/` and `adapters/generic/` describe the same contract without Cursor-specific UI:

- Read `skills/uads-orchestrator/SKILL.md`
- Honor global-first and zero footprint
- Run `uads` for environment and review artifacts
- Persist checkpoints only in the sidecar (when the orchestrator exists)

## Contract

Adapters must not dump UADS state into the project to “make the host happy.” If a host requires an in-repo file, it is an explicit opt-in and a freeze exception.
