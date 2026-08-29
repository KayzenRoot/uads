# 07 — Quality gates

Evidence-first delivery requires gates. Prompt 001 implements the **foundation** gates for this repository. Prompt 002 adds a **selection engine** that chooses relevant gate IDs per Work Order (not a dump of every gate).

## Foundation gates (this repo)

- **Lint / static check:** `npm run lint` runs TypeScript `tsc --noEmit`. This is a compile/static check, not ESLint.
- Typecheck (`tsc --noEmit`; currently the same command as lint)
- Unit and CLI smoke tests (`vitest`)
- Orchestrator routing evals (`npm run eval:orchestrator`)
- Agent Skills compatibility preflight (`npm run validate:skills`)
- Validation inventory + CLI smoke (`scripts/validate/validate-foundation.mjs`)
- Dependency audit (`npm audit`) captured as sidecar evidence
- CI on pull requests and pushes (`.github/workflows/ci.yml`)

Command outputs are written under `~/.uads/workspaces/<project-id>/evidence/` by `scripts/validate/capture-evidence.mjs`, not into git.

## Selected gate classes (kernel)

The planner picks from static, unit-test, integration-test, contract-test, build, security-review, database-migration, rollback-validation, web3-unit/fuzz/invariant, financial-numerical-validation, simulation-invariant, performance-check, and related IDs.

Style-only frontend work does not require Web3 fuzzing. DeFi withdrawal requires web3-unit, fuzz, invariant, and security review.

A change is not done if a relevant gate was skipped without an explicit waiver recorded as evidence.
