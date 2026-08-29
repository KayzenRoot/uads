# 07 — Quality gates

Evidence-first delivery requires gates. Prompt 001 implements the **foundation** gates for this repository; the general engine is reserved in `core/gates/`.

## Foundation gates (this repo)

- **Lint / static check:** `npm run lint` runs TypeScript `tsc --noEmit`. This is a compile/static check, not ESLint.
- Typecheck (`tsc --noEmit`; currently the same command as lint)
- Unit and CLI smoke tests (`vitest`)
- Validation inventory + CLI smoke (`scripts/validate/validate-foundation.mjs`)
- Dependency audit (`npm audit`) captured as sidecar evidence
- CI on pull requests and pushes (`.github/workflows/ci.yml`)

Command outputs are written under `~/.uads/workspaces/<project-id>/evidence/` by `scripts/validate/capture-evidence.mjs`, not into git.

## Target gate classes (later)

| Gate | When |
| --- | --- |
| Static | lint, types, formatting |
| Tests | unit, integration, smoke |
| Security | secret scan, dependency review, packaging exclusions |
| Performance | budgets for hot paths when the change can affect them |
| Architecture | freeze compatibility, footprint, review ZIP |

A change is not done if a relevant gate was skipped without an explicit waiver recorded as evidence.
