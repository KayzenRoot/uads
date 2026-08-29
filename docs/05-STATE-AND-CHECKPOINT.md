# 05 — State and checkpoint

## Rule

UADS operational state belongs in the global sidecar:

`~/.uads/workspaces/<project-id>/`

Never commit UADS checkpoints, work orders, or review ZIPs to the managed project by default.

## Project profile

`profile.json` follows `schemas/project-profile.schema.json`. The foundation CLI creates or updates it when generating a review bundle.

## Checkpoint (v0.2, durable)

`schemas/checkpoint.schema.json` is persisted at `state/current.json` plus `state/checkpoints/`. Writes are temp+rename. Corrupt current state is reported, not silently trusted; a prior valid checkpoint may be recovered.

Lifecycle: intake → classify → plan → implement → verify → review → stopped.

Prompt 002 drives through **plan**. Prompt 003 adds durable execution runs under `execution-runs/<id>/`. `uads dispatch --session` binds the implementer session and advances the checkpoint to implement only after a clean worktree baseline. `uads resume` returns execution ids, digest, pending/failed gates, reviewers, and next action without a full repository walk.

Dirty pre-existing worktrees block dispatch. UADS does not reset, stash, or delete user files. Active checkpoint, Work Order, routing decision, run, and packet IDs are cross-checked. Corrupt evidence/review JSON fails closed rather than disappearing from the audit history.

`uads resume` returns a compact packet (ids, phase, objective, specialists/gates, map digest, next action) without rereading the repository.

## Work orders

`schemas/work-order.schema.json` v0.2.0 is the unit of planned work. The kernel plans; it does not call model APIs. Host agents apply in-scope edits after `uads dispatch`. Completion requires `uads finalize`.

Routing conclusions live in `schemas/routing-decision.schema.json`.

## Discipline

- Write checkpoints after each meaningful phase
- On resume, read the latest checkpoint first
- Treat sidecar files as durable but not source-of-truth for product code
