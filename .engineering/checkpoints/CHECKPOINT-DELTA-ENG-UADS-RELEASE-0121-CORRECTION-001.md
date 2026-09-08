# Checkpoint Delta - `ENG-UADS-RELEASE-0121-CORRECTION-001`

Status: `PROPOSED`
Canonical promotion: `PENDING_MAINTAINER`

## Lifecycle transition

- Before: `ENG-UADS-RELEASE-0120-001` release publication `BLOCKED` after the
  deterministic `0.12.0` title failure.
- After proposed: bounded correction PR prepared for independent audit, with
  `0.12.1` metadata and no release/tag publication.

## Completed steps

- Context Lock verified against current GitHub and local state.
- Existing `v0.12.0` annotated tag identity preserved.
- Generic publisher title path corrected to consume the validated changelog
  section.
- Regression tests and `0.12.1` metadata added.
- Evidence Bundle and correction governance records created.

## Open items

- Complete local validation and exact PR-head hosted checks.
- Independent review of the exact correction head.
- Maintainer decision on protected merge.
- Future `0.12.1` release publication is outside this delta.

## Safety statement

This delta does not modify UADS canonical sidecar state, move any tag, create
any release, or self-promote the correction. A maintainer must accept any
promotion.
