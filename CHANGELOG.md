# Changelog

All notable changes to UADS (NexLabs) are documented here.

## [0.2.0] - 2026-08-29

### Added

- Orchestrator kernel: structured intake, repository inspect/cache, scope/risk/domain routing, specialist and gate selection, context radius, provider-neutral token budgets
- CLI: `uads inspect`, `uads plan --request` (fallback classifier), `uads plan --intake`, `uads resume`; `uads status` now reports Work Order/phase/risk/gates
- Sidecar artifacts: Work Orders, routing decisions, checkpoints, context plan, repository-map cache under `~/.uads/workspaces/<id>/`
- JSON schemas: intake, routing-decision; Work Order and checkpoint advanced to 0.2.0
- Orchestrator Skill progressive disclosure (`references/`) and Agent Skills compatibility preflight
- Canonical `agents/uads-*.md` plus Cursor user-level adapter (tests use isolated HOME)
- Routing eval suite `npm run eval:orchestrator` (E1–E8 + negative routing)

### Fixed (Correction 01)

- Persist orchestration state through a single secret-safe text boundary before sidecar writes
- Require operational Work Order, routing-decision, and checkpoint fields as authoritative schema state
- CRITICAL/architectural context radius now precedes HIGH/cross-cutting (C4, never default C5)
- Context candidates follow radius semantics instead of appending every mapped module
- Canonical gate registry includes dependency-audit, architecture-conformance, and release-check
- Risk uses task-relevant repository signals only; inspector adds cheap database/migration/Web3 and relative agent/skill locations

### Notes

- The kernel plans and persists; it does not execute arbitrary customer-project edits or call provider APIs
- C5 repository-wide context is not the default; implementer is never the sole reviewer

## [0.1.0] - 2026-08-29

### Added

- Public repository foundation for Universal Autonomous Development Studio
- Apache License 2.0, NOTICE, and OSS governance documents
- Architecture Freeze v0.2 documentation set under `docs/`
- Minimal CLI: `uads --help`, `uads doctor`, `uads status`, `uads review`
- Global-first install scripts (`scripts/install/install.sh`, `install.ps1`)
- Sidecar workspace under `~/.uads/workspaces/<project-id>/`
- Review ZIP generator with SHA-256 checksum and secret/heavy-path exclusion
- JSON schemas for checkpoint, work order, evidence, review, project profile, repository map
- Agent Skill entrypoint `skills/uads-orchestrator/SKILL.md`
- Foundation tests, validation script, and GitHub Actions CI

### Fixed (Correction 01)

- Review ZIP now captures sidecar validation evidence (`evidence/`)
- Layered secret sanitization for remotes, diffs, source, and evidence (defense-in-depth)
- Privacy-minimized shareable manifests (no absolute host paths)
- Global installer installs a usable `uads` CLI via npm prefix
- `npm run lint` documented as TypeScript `tsc --noEmit`, not ESLint
- `npm audit` captured as evidence; production high/critical findings are blocking
- Upgraded Vitest to 3.2.7 so `npm audit` reports 0 vulnerabilities
### Fixed (Correction 02)

- Host-path sanitization covers Windows drive paths (both slash styles), UNC paths, and Unix homes
- Ordinary source such as `src/lib/secrets.ts` is included in review ZIPs; only sensitive data files are excluded by name
- Review ZIP SHA-256 is computed only after inspecting the delivered bytes
- Inspector validates `schemas/review-manifest.schema.json` with Ajv, rejects unsafe/duplicate ZIP paths, and scans for host paths and high-confidence secrets
- Child processes run with `shell: false`; npm is invoked via `npm-cli.js`
- Review ZIP writing uses `adm-zip` only; `archiver` was removed to drop deprecated `glob@10`
- Installer verifies the CLI via `node …/dist/cli.js` on both Windows and Unix npm prefix layouts
