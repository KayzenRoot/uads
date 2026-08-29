# cursor

Canonical UADS specialist files live in package `agents/` and `~/.uads/agents/`.

The adapter may copy managed `uads-*` definitions into the user-level Cursor agents directory. It never writes project-level `.cursor/agents` by default and does not overwrite unrelated user agents.

Hosts still invoke `skills/uads-orchestrator/SKILL.md` and the CLI.

UADS by NexLabs. See `docs/` for Architecture Freeze v0.2.
