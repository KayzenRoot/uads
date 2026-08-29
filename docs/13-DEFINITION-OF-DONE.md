# 13 — Definition of done

## Prompt 001 increment

Complete only when all are true:

- Professional OSS structure
- NexLabs ownership reflected in docs
- Apache-2.0 license
- Architecture Freeze v0.2 documented
- Minimal CLI works
- Global sidecar workspace works
- Review ZIP generation works
- Review ZIP excludes secrets and heavy directories
- Checksum generated
- Schemas exist
- Skill entrypoint exists
- Tests exist and pass
- CI workflow exists
- Validation script exists and passes
- `CHANGELOG.md` and `VERSION` updated
- A review ZIP was generated
- Final review report includes files changed, tests run, results, and known limitations

## Prompt 002 increment

Complete only when all are true:

- Prompt 001 security/review guarantees remain passing
- Version is 0.2.0
- `uads inspect`, `plan --request`, `plan --intake`, `status`, and `resume` work
- Repository map is sidecar-only and cacheable
- Intake / Work Order / checkpoint / routing-decision schemas are enforced
- Implementer is never the sole final reviewer
- Orchestrator Skill uses progressive disclosure; skills preflight passes
- Cursor adapter is tested against an isolated HOME
- Zero project footprint after inspect/plan/status/resume
- Orchestrator eval suite and negative-routing assertions pass
- lint, typecheck, build, tests, aggregate validation, and npm audit pass
- Final commit is on origin/main with a privacy-minimized review ZIP

## Ongoing product DoD

A work order is done only with evidence for selected gates, footprint, independent review when implementation occurred, and (when requested) a review bundle.
