# UADS

**Universal Autonomous Development Studio** by **NexLabs**.

UADS is a global-first autonomous software engineering orchestration framework. It helps agents build Web2, Web3, SaaS, AI, finance, quant, math-heavy systems and games with architecture discipline, quality gates, security and performance verification, evidence-based delivery, and review bundles for external audit.

This repository is the public open-source foundation (Prompt 001). The full orchestrator is not implemented yet.

## Architecture Freeze v0.2 (summary)

- **Global-first install** under `~/.uads/`
- **Zero project footprint** by default — no operational UADS state in the managed project
- **Sidecar workspace** at `~/.uads/workspaces/<project-id>/`
- Agent Skills entrypoint, Cursor + Codex/generic adapters
- Context routing, repository map, dependency/impact map
- Token budget manager and cache-first prompt architecture
- Model routing, evidence protocol, review ZIP workflow
- Staged implementation roadmap

Normative detail: [`docs/`](docs/).

## Quick start

Requires Node.js 20+.

```bash
./scripts/install/install.ps1   # Windows
./scripts/install/install.sh    # Unix
uads doctor
uads review
```

If the installer used `~/.uads/npm` (or `UADS_NPM_PREFIX`), add that prefix (Unix: `.../bin`) to PATH.

From source:

```bash
npm install
npm run build
node dist/cli.js --help
node dist/cli.js doctor
node dist/cli.js status
node dist/cli.js review
```

`npm run lint` is TypeScript `tsc --noEmit` (compile/static check; not ESLint).

Review bundles and validation evidence are written **outside** the project:

`~/.uads/workspaces/<project-id>/reviews/`
`~/.uads/workspaces/<project-id>/evidence/`

## Layout

| Path | Role |
| --- | --- |
| `src/` | Foundation CLI |
| `skills/uads-orchestrator/` | Agent Skill entrypoint |
| `core/` | Reserved orchestrator modules |
| `adapters/` | Cursor / Codex / generic adapters |
| `schemas/` | Checkpoint, work order, evidence, review, profile, repo map |
| `docs/` | Architecture Freeze v0.2 |
| `scripts/` | Install, review, validate |

## License

Apache License 2.0. See `LICENSE` and `NOTICE`.

Copyright 2026 NexLabs.
