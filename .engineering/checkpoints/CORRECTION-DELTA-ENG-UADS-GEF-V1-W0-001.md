# Correction Delta - `ENG-UADS-GEF-V1-W0-001`

Status: `APPLIED`
Baseline Git SHA: `9a075d04abeb0d853dffbd25bdfd4efad52d8130`

## Problem

HEDS identified three HIGH blockers on the W0 candidate: the increment lacked
one immutable engineering identity, project command metadata always persisted
`npm run`, and the public GEF CLI contract had no end-to-end integration tests.

## Root cause

The first W0 implementation retained the planning identity
`UADS-GEF-V1-NATIVE-IMPLEMENTATION`, used a generic npm-oriented command
formatter without consulting the detected lockfile, and stopped at unit tests
of registry/command functions rather than executing the built CLI in fresh
processes.

## Bounded changes

- Normalize governance artifacts, branch, and replacement PR to
  `ENG-UADS-GEF-V1-W0-001`.
- Map npm, pnpm, yarn, and bun lockfiles to their bounded `run` forms and emit
  null commands for unknown managers.
- Extend the closed profile schema and focused native tests for all five
  package-manager cases.
- Add built-CLI integration coverage for status, adopt, shadow adopt, profile
  show, and doctor, including global-only writes, schema/privacy safety, and
  corrupt-state fail-closed behavior.
- Add the canonical detailed W0-W8 map and reconcile issue #27.

## Verification

- Focused package-manager and CLI tests: 11/11 passed.
- Required local matrix: 420/420 tests, host-execution 52/52, all evals,
  engineering validation, lint, typecheck, build, validate, and audit-high
  passed; one moderate `adm-zip` advisory remains.
- Exact-head hosted gates: pending until the replacement branch is pushed.
- Independent HEDS re-review: pending; executor cannot self-approve.

## Remaining risks

- GEF-02 through GEF-27 remain staged and W1 is blocked.
- The existing PR #29 is intentionally left open and unmerged until the
  replacement PR is open.
