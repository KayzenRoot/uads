# Evidence Bundle - `ENG-UADS-RELEASE-0121-CORRECTION-001`

Status: `DRAFT`
Repository: `KayzenRoot/uads`
Baseline Git SHA: `da05b3ecdeec5febf3ffdfd65c008ea311ccb8b3`
Head Git SHA: `pending`

## Claims

| Claim | Kind | Reference | Status | Notes |
| --- | --- | --- | --- | --- |
| Context Lock | file/github | `.engineering/context-locks/ENG-UADS-RELEASE-0121-CORRECTION-001.md` | PASS | Locked baseline, tag, release absence, failed run, and correction audit before writes |
| Root cause | github/file | Release run `34177150747` / job `101908720321`; `scripts/release/publish-release.mjs` | PASS | Publisher discarded the validated changelog before title derivation |
| Immutable tag | github | `v0.12.0` tag object `82c99cb84097c11634c1b713c8370df2144d6e60`; peeled commit `da05b3ecdeec5febf3ffdfd65c008ea311ccb8b3` | PASS | No tag mutation authorized or performed |
| Absent `v0.12.0` release | github | GitHub release lookup | PASS | Release remains absent |
| Generic title correction | file/test | `scripts/release/publish-release.mjs`; `tests/release-engineering.test.ts` | PENDING | Local and hosted verification recorded after execution |
| Version metadata | file | `VERSION`, `package.json`, `package-lock.json` | PENDING | Must be exactly `0.12.1` |
| Changelog correction | file | `CHANGELOG.md` | PENDING | `[Unreleased]` preserved; `0.12.1` documents partial `0.12.0` state |
| Historical immutability | github | `v0.11.1`, `v0.11.0`, and prior release evidence | PENDING | Read-only post-change verification required |
| Local gates | command | Work Order required commands | PENDING | No failing or ambiguous gate may be accepted |
| Hosted gates | github | Exact correction PR head | PENDING | Foundation, CodeQL, Dependency Review, Linux/Windows compatibility |
| Independent review | github | Correction PR | PENDING | PR must remain open and unmerged |

## Identity binding

- Work Order: `.engineering/work-orders/ENG-UADS-RELEASE-0121-CORRECTION-001.md`.
- Context Lock: `.engineering/context-locks/ENG-UADS-RELEASE-0121-CORRECTION-001.md`.
- Baseline: `.engineering/baselines/ENG-UADS-RELEASE-0121-CORRECTION-001.md`.
- Correction Delta: `.engineering/checkpoints/CORRECTION-DELTA-ENG-UADS-RELEASE-0121-CORRECTION-001.md`.
- Checkpoint Delta: `.engineering/checkpoints/CHECKPOINT-DELTA-ENG-UADS-RELEASE-0121-CORRECTION-001.md`.
- Change summary: pending exact correction head.

## Privacy review

- [x] No credentials, raw tokens, private keys, customer data, or absolute host paths.
- [x] Generated/cache/vendored material is excluded.
- [ ] Local and hosted gate outputs are attached after verification.
- [ ] Independent reviewer has audited the exact correction head.

This bundle is evidence for independent review, not a self-approval record.
