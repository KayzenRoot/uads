# Work Order: UADS-GEF-V1-NATIVE-IMPLEMENTATION / W0

Status: `COMPLETE_CANDIDATE`
Repository: `KayzenRoot/uads`
Branch: `codex/gef-v1-w0`
Base SHA: `312e32946798eb3abbb49a79af08e13efb7719dc`
Head SHA: `external final executor report after the W0 correction-free candidate commit`
Risk: `HIGH`
Assurance: `A0-A4`
Merge: forbidden until exact-head required gates and independent HEDS approval.

## Scope

W0 implements contracts and skeleton only: global GEF storage paths, closed
profile/current/adoption-gap schemas, stable project identity, Project
Registry, adoption classification, read-only status/doctor, and focused tests.
The implementation preserves active functional work and does not touch PR #77
(no open PR #77 was found during preflight).

## Reused canonical infrastructure

- Existing `resolveUadsHome` and sidecar workspace path abstraction.
- Existing remote-normalizing `computeProjectFingerprint`.
- Existing Git summary and atomic JSON persistence helpers.
- Existing AJV 2020 schema validator and provider-neutral CLI.

## Forbidden in W0

No provider calls, arbitrary shell from model input, project-local GEF state,
authoritative proof/test skipping, merge, release, changes to unrelated active
PRs, or implementation of later waves in this candidate.

## Required gates

- `git diff --check`
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- focused GEF W0 tests
- `npm test`
- `npm run validate`
- `npm audit --audit-level=high`
- exact-head Foundation/CI, CodeQL/security, Dependency Review, and
  Cross-Platform checks
- independent HEDS review on the exact candidate head

The final head/tree and hosted run IDs remain external evidence after the last
repository commit. No evidence-only commit is permitted after those checks.
