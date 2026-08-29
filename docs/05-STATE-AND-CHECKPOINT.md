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

Prompt 002 drives through **plan**. Later phases may appear in the schema but must not be marked completed unless they happened.

`uads resume` returns a compact packet (ids, phase, objective, specialists/gates, map digest, next action) without rereading the repository.

## Work orders

`schemas/work-order.schema.json` v0.2.0 is the unit of planned work. The kernel plans; it does not autonomously edit customer projects in this increment.

Routing conclusions live in `schemas/routing-decision.schema.json`.

## Discipline

- Write checkpoints after each meaningful phase
- On resume, read the latest checkpoint first
- Treat sidecar files as durable but not source-of-truth for product code
