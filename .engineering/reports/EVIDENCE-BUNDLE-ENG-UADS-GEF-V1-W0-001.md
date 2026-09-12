# Evidence Bundle - `ENG-UADS-GEF-V1-W0-001`

Status: `PARTIAL`
Repository: `KayzenRoot/uads`
Baseline Git SHA: `9a075d04abeb0d853dffbd25bdfd4efad52d8130`
Head Git SHA: `e6422fe6fc6db9fc0031dbd18fae037080fc59b8`
Head Git tree: `7a97e9d2ef3309614675b36f30b915d4f1c4d260`

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

## Final binding

The corrected candidate SHA/tree and exact-head hosted receipts must be
supplied once in the replacement PR's Portuguese executor report after the
final push. This bundle must not receive a post-check evidence-only commit.
