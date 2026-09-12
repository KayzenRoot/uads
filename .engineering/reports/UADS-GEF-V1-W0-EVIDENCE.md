# UADS GEF V1 W0 Evidence Bundle

This is the human projection of the W0 evidence manifest. The canonical
machine record is `UADS-GEF-V1-W0-EVIDENCE-MANIFEST.json`; exact final head,
tree, hosted run IDs, and independent HEDS verdict are intentionally bound by
the final external executor report after the last repository commit.

## Candidate

- Work Order: `UADS-GEF-V1-NATIVE-IMPLEMENTATION`
- Wave: `W0`
- Base: `312e32946798eb3abbb49a79af08e13efb7719dc`
- Branch: `codex/gef-v1-w0`
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

## Final binding

The final candidate SHA/tree and exact-head hosted receipts must be supplied
once in the external final executor report after the final push. This source
bundle intentionally does not receive a post-check evidence-only commit.
