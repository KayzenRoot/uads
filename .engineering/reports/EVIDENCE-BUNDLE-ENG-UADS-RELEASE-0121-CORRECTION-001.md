# Evidence Bundle - `ENG-UADS-RELEASE-0121-CORRECTION-001`

Status: `COMPLETE`
Repository: `KayzenRoot/uads`
Baseline Git SHA: `da05b3ecdeec5febf3ffdfd65c008ea311ccb8b3`
Head Git SHA: `3ef2b051f57fe4563fa26cf9892170c82eb3c520`

## Claims

| Claim | Kind | Reference | Status | Notes |
| --- | --- | --- | --- | --- |
| Context Lock | file/github | `.engineering/context-locks/ENG-UADS-RELEASE-0121-CORRECTION-001.md` | PASS | Locked baseline, tag, release absence, failed run, and correction audit before writes |
| Root cause | github/file | Release run `34177150747` / job `101908720321`; `scripts/release/publish-release.mjs` | PASS | Publisher discarded the validated changelog before title derivation |
| Immutable tag | github | `v0.12.0` tag object `82c99cb84097c11634c1b713c8370df2144d6e60`; peeled commit `da05b3ecdeec5febf3ffdfd65c008ea311ccb8b3` | PASS | No tag mutation authorized or performed |
| Absent `v0.12.0` release | github | GitHub release lookup | PASS | Release remains absent |
| Generic title correction | file/test | `scripts/release/publish-release.mjs`; `tests/release-engineering.test.ts`; focused 23/23 | PASS | Generic path receives authoritative changelog notes; malformed sources fail closed |
| Version metadata | file | `VERSION`, `package.json`, `package-lock.json` | PASS | All root versions are exactly `0.12.1` |
| Changelog correction | file | `CHANGELOG.md` | PASS | `[Unreleased]` preserved; `0.12.1` documents partial `0.12.0` state |
| Historical immutability | github | `v0.11.1`, `v0.11.0`, and prior release evidence | PASS | Read-only verification found no mutation |
| Local gates | command | `npm ci`, build, engineering validation, lint, typecheck, focused tests, npm audit | PASS | Complete local Windows suite did not conclude; no failure emitted |
| Hosted gates | github | Foundation `34220628606`; CodeQL `34220628607`; Dependency Review `34220628640`; Compatibility `34220628622` | PASS | Exact head; 49 files / 409 tests; HEB01-HEB52; all evals; finalVerdict PASS |
| Independent review | github | Correction PR | PENDING | PR must remain open and unmerged |

## Identity binding

- Work Order: `.engineering/work-orders/ENG-UADS-RELEASE-0121-CORRECTION-001.md`.
- Context Lock: `.engineering/context-locks/ENG-UADS-RELEASE-0121-CORRECTION-001.md`.
- Baseline: `.engineering/baselines/ENG-UADS-RELEASE-0121-CORRECTION-001.md`.
- Correction Delta: `.engineering/checkpoints/CORRECTION-DELTA-ENG-UADS-RELEASE-0121-CORRECTION-001.md`.
- Checkpoint Delta: `.engineering/checkpoints/CHECKPOINT-DELTA-ENG-UADS-RELEASE-0121-CORRECTION-001.md`.
- Change summary: PR #22, implementation head `3ef2b051f57fe4563fa26cf9892170c82eb3c520`; governance evidence is bounded to this correction.

## Hosted proof details

- Foundation: run `34220628606`, job `102042637510`, success; 49 test files,
  409 tests, HEB01-HEB52, all evals, npm audit clean, finalVerdict PASS.
- CodeQL: run `34220628607`, job `102042637898`, success; aggregate CodeQL
  check `102042938318`, success.
- Dependency Review: run `34220628640`, job `102042637397`, success.
- Linux Node 20: run `34220628622`, job `102042638016`, success; evidence
  digest `597d476e6f48c34b213912cf8d2038f08ed30939eb802aaefb022094bb2b79bb`.
- Windows Node 20: run `34220628622`, job `102042637651`, success; evidence
  digest `131d0ff929868e5b5bb4489e36251631a6a497f3f16f301b25d0c4298c0aad9b`.
- PR: `https://github.com/KayzenRoot/uads/pull/22`, open and merge state
  clean; no merge performed.

## Privacy review

- [x] No credentials, raw tokens, private keys, customer data, or absolute host paths.
- [x] Generated/cache/vendored material is excluded.
- [x] Local and hosted gate outputs are recorded above.
- [ ] Independent reviewer has audited the exact correction head.

This bundle is evidence for independent review, not a self-approval record.
