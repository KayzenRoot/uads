# 03 — Scope

## In scope (Prompt 001)

- OSS repository governance
- Architecture Freeze v0.2 documentation
- Directory skeleton for future modules
- Minimal TypeScript CLI
- Global-first install scripts
- Skill entrypoint
- Schemas
- Review ZIP + checksum
- Tests, validation script, GitHub Actions CI

## Out of scope (Prompt 001)

- Complete autonomous orchestrator
- All specialist agents
- Real multi-agent delegation
- Production third-party Skill registry
- Marketplace, dashboard, cloud control plane, enterprise server
- Deep UGAS integration (directory + stub only)
- Unnecessary complexity

## Scope classification (runtime, later)

When the orchestrator exists, every work order is classified before expansion:

- `trivial` — single file, no gates beyond sanity
- `local` — one module
- `cross-cutting` — several modules, tests required
- `architectural` — freeze-impacting; docs + review ZIP required

Prompt 001 only documents this policy.
