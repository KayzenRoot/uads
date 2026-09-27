# Evidence Bundle - `ENG-UADS-GEF-V1-W0-001`

Status: `PARTIAL`
Repository: `KayzenRoot/uads`
Baseline Git SHA: `9a075d04abeb0d853dffbd25bdfd4efad52d8130`
Head Git SHA: `external final executor report after the final correction commit`

This is the human projection of the W0 evidence manifest. The canonical
machine record is `EVIDENCE-MANIFEST-ENG-UADS-GEF-V1-W0-001.json`; exact final head,
tree, hosted run IDs, and independent HEDS verdict are intentionally bound by
the final external executor report after the last repository commit.

## Candidate

- Work Order: `ENG-UADS-GEF-V1-W0-001`
- Wave: `W0`
- Correction baseline: `9a075d04abeb0d853dffbd25bdfd4efad52d8130`
- Reviewed program base: `312e32946798eb3abbb49a79af08e13efb7719dc`
- Branch: `fix/eng-uads-gef-v1-w0-001`
- Merge: forbidden until exact-head gates and independent HEDS approval.

## Evidence scope

W0 adds the global Project Registry, stable remote-plus-generation identity,
global `~/.uads/gef/` path contract, three closed schemas, adoption
classification/gap reporting, and read-only CLI status/doctor surfaces. It
reuses existing UADS fingerprint, sidecar, atomic persistence, and schema
validation facilities. No provider call, arbitrary project command, or
project-local GEF state is introduced.

`SHADOW_PLANNED` is non-authoritative and the adoption-gap manifest fixes
`authoritativeSkippingEnabled` to `false`. GEF-02 through GEF-27 remain
staged; W0 does not claim global GEF readiness.

## Correction findings and closure evidence

- CR01: all correction governance records use `ENG-UADS-GEF-V1-W0-001`, and
  the replacement branch/PR use the same identity.
- CR02: `source.ts` derives bounded commands from npm, pnpm, yarn, or bun and
  emits null commands for unknown managers; schema and tests cover all cases.
- CR03: `tests/gef-native.test.ts` executes the built CLI for status, adopt,
  shadow adopt, profile show, and doctor, proving read-only, global-only,
  schema/privacy, corruption, and shadow behavior.
- Governance-only wave reconciliation: `docs/17-GEF-V1-CANONICAL-WAVE-MAP.md`.

## Local verification on the final pre-push candidate

- `git diff --check`: PASS.
- `npm ci`: PASS; one moderate `adm-zip` advisory, no high/critical finding.
- `npm run validate:engineering`: PASS.
- `npm run lint`, `npm run typecheck`, `npm run build`: PASS.
- Focused GEF tests: 11/11 PASS.
- `npm test`: 50 files / 420 tests PASS.
- `npm run eval:host-execution`: 52/52 PASS.
- `npm run validate`: PASS; orchestrator 9/9, execution 9/9, context 19/19,
  fault 18/18, cost 27/27, model routing 22/22, specialist routing 26/26,
  adapters 40/40, assurance 22/22, fault-injection 32/32.

## Final binding

The corrected candidate SHA/tree and exact-head hosted receipts must be
supplied once in the replacement PR's Portuguese executor report after the
final push. This bundle must not receive a post-check evidence-only commit.
