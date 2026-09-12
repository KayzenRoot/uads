# Work Order - `ENG-UADS-GEF-V1-W0-001`

Status: `READY_FOR_REVIEW`
Repository: `KayzenRoot/uads`
Branch: `fix/eng-uads-gef-v1-w0-001`
Baseline Git SHA: `9a075d04abeb0d853dffbd25bdfd4efad52d8130`
Head Git SHA: `e6422fe6fc6db9fc0031dbd18fae037080fc59b8`
Head Git tree: `7a97e9d2ef3309614675b36f30b915d4f1c4d260`
Scope class: `cross-cutting`
Risk: `HIGH`
Merge: forbidden until exact-head required gates and independent HEDS approval.

## Scope

Close only the three blocking HEDS findings on the W0 candidate: immutable
engineering identity, package-manager-aware bounded command metadata, and
end-to-end CLI coverage. Preserve W0 architecture and history; do not begin
W1 or implement GEF-02 through GEF-27.

## Reused canonical infrastructure

- Existing `resolveUadsHome` and sidecar workspace path abstraction.
- Existing remote-normalizing `computeProjectFingerprint`.
- Existing Git summary and atomic JSON persistence helpers.
- Existing AJV 2020 schema validator and provider-neutral CLI.

## Correction scope

- CR01: normalize this Work Order, Context Lock, Baseline, Correction Delta,
  Evidence Bundle/manifest, Checkpoint Delta, branch, and replacement PR to
  `ENG-UADS-GEF-V1-W0-001`.
- CR02: derive `npm run`, `pnpm run`, `yarn run`, or `bun run` from the detected
  lockfile; persist null commands for unknown managers; keep the profile schema
  closed and bounded.
- CR03: run all five public GEF W0 CLI surfaces through the built CLI in fresh
  processes and prove global-only, schema, privacy, corruption, and shadow
  behavior.
- Governance-only: add the canonical detailed W0-W8 map and reconcile issue
  #27 without implementing later waves.

## Forbidden in W0

No GEF-02 through GEF-27 implementation, provider calls, arbitrary shell from
model input, project-local GEF state, authoritative proof/test skipping, merge,
release, dependency upgrade, unrelated PR change, or broad cleanup.

## Required gates

- `git diff --check`
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- focused GEF W0 tests
- focused GEF CLI integration tests
- `npm test`
- `npm run eval:host-execution`
- `npm run validate`
- `npm audit --audit-level=high`
- exact-head Foundation/CI, CodeQL/security, Dependency Review, and
  Cross-Platform checks
- independent HEDS review on the exact candidate head

The corrected branch/PR must be opened before PR #29 is closed. The final
head/tree and hosted run IDs are bound to the replacement candidate; no
evidence-only commit is permitted after hosted checks.

## Review and delivery

- Independent reviewer: HEDS / repository maintainer.
- Replacement PR title: `fix(ENG-UADS-GEF-V1-W0-001): close W0 correction findings`.
- Evidence Bundle: `.engineering/reports/EVIDENCE-BUNDLE-ENG-UADS-GEF-V1-W0-001.md`.
- Evidence manifest: `.engineering/reports/EVIDENCE-MANIFEST-ENG-UADS-GEF-V1-W0-001.json`.
- Correction Delta: `.engineering/checkpoints/CORRECTION-DELTA-ENG-UADS-GEF-V1-W0-001.md`.
- Checkpoint Delta: `.engineering/checkpoints/CHECKPOINT-DELTA-ENG-UADS-GEF-V1-W0-001.md`.
