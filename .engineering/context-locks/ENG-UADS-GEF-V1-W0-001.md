# Context Lock - `ENG-UADS-GEF-V1-W0-001`

State: `RELOCKED`
Repository: `KayzenRoot/uads`
Baseline Git SHA: `9a075d04abeb0d853dffbd25bdfd4efad52d8130`
Generated at: `2026-09-12T17:32:44.2597471Z`

Base source identity: `312e32946798eb3abbb49a79af08e13efb7719dc`
Base source tree: `b2a6763045fc1dbb81b6ba2880bf1f77167d7133`
Active branch: `fix/eng-uads-gef-v1-w0-001`
Reviewed source PR: #29, open and unmerged; replacement PR pending.

## Required fingerprints after relock

| Source | Relative path or deterministic sentinel | SHA-256 |
| --- | --- | --- |
| Executor rules | `.engineering/PROTOCOL.md` | `f1ccaf41ae75ba578ed0d548e0d601ed56fe30dd0eff9d7cef00028ec71a60cf` |
| Work Order schema | `.engineering/schemas/engineering-work-order.schema.json` | `8aa75828dcc295e6c11766799c591bc2a67d74af885a90856210e08d17f34917` |
| Checkpoint | `.engineering/checkpoints/CHECKPOINT-DELTA-ENG-UADS-GEF-V1-W0-001.md` | `3e815efa39b48f52cf19254eadbab20e24dde1cee7edfc4363d0162d943508cf` |
| Decisions | `.engineering/DECISIONS.md` | `7c6b9f3f93ffed0005a65fe621c142d0979235204ccdf0e346fea92a9f7b2619` |
| Scope | `docs/03-SCOPE.md` | `6279be976392994255ed380ff10c52d2a17629015b3766d9a236c8dd76fc7f73` |
| Architecture | `docs/04-ARCHITECTURE.md` | `2034034d02ae39d4431886a58242e5f2bb729a2c27fbbb2a75a5db30aedada8a` |
| Quality gates | `docs/07-QUALITY-GATES.md` | `fcf75d7aea8b96dd8889022850be3610e8c6dd5663b93a097c8ae9665fad392d` |
| Definition of Done | `docs/13-DEFINITION-OF-DONE.md` | `f6f624adfe2dd02872cb31e60ec490c7351fca9ac207eacb20213d48cefda818` |
| Canonical wave map | `docs/17-GEF-V1-CANONICAL-WAVE-MAP.md` | `35e8cae4298441cdb947d4f3c5c00536df4b4bcd72a7f6b2521cbcc49fc42772` |
| GEF source discovery | `src/gef/source.ts` | `d6947633432558c775feb076068314ef4acc209185d6a226b12bd9ae45edf973` |
| GEF registry | `src/gef/registry.ts` | `a95bee4649ca660781f8e51d6d2c1520499b9e31e6f5951d5718911c4eb00f20` |
| GEF commands | `src/commands/gef.ts` | `20c21278c66bbb324c7582362bf3356476cb7b1e628e1ec47b6d3196b8182bd9` |
| CLI | `src/cli.ts` | `da39d88cbe24c58da2bbdbfb8c8f1446bc4c627227dd13cf8a2c24031a3755333` |
| Profile schema | `schemas/gef-project-profile.schema.json` | `5502466e62de19477fe36a46c5b76103fad4c33a031e2de4cda178f2605ecfa6` |
| GEF tests | `tests/gef-native.test.ts` | `63dbbb05d89dfcaeb5945be6cc92c1ff62d02199b8614aa5b84bcb282becbc7f` |

## Locked source boundaries

- Existing global UADS home and workspace APIs in `src/lib/workspace.ts`.
- Existing project fingerprint normalization in `src/lib/fingerprint.ts`.
- Existing Git summary and safe process invocation in `src/lib/git.ts` and
  `src/lib/exec.ts`.
- Existing atomic JSON and AJV validation contracts.
- Existing CLI remains provider-neutral and does not execute providers.

## W0 authority boundary

The W0 GEF registry records metadata only. It cannot authorize execution,
proof reuse, test skipping, merge, or release. Later waves must preserve this
fail-closed boundary and revalidate source identity before acting.

## Stale events and relock evidence

- The pre-correction lock was stale when CR01-CR03 changed the locked source
  files; this was expected and was not ignored.
- Re-inspection: `git fetch --all --prune`, exact base/head/tree checks, issue
  #27/#28 and PR #29 review-state inspection, and focused build/test rerun.
- Relock reason: source/schema/test/governance changes were bounded to the
  correction Work Order and revalidated before continuing.
- Next stale event: stop and relock if any listed source or external identity
  changes before the corrected candidate is submitted.
