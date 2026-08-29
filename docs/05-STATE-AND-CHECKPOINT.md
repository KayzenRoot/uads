# 05 — State and checkpoint

## Rule

UADS operational state belongs in the global sidecar:

`~/.uads/workspaces/<project-id>/`

Never commit UADS checkpoints, work orders, or review ZIPs to the managed project by default.

## Project profile

`profile.json` follows `schemas/project-profile.schema.json`. The foundation CLI creates or updates it when generating a review bundle.

## Checkpoint (schema only in Prompt 001)

`schemas/checkpoint.schema.json` defines:

- `phase`: intake → classify → plan → implement → verify → review → stopped
- `status`: pending | in_progress | blocked | completed | failed
- `resumeCursor` so a later orchestrator can continue without repeating finished steps

## Work orders

`schemas/work-order.schema.json` is the unit of planned work. Not executed in Prompt 001.

## Discipline

- Write checkpoints after each meaningful phase
- On resume, read the latest checkpoint first
- Treat sidecar files as durable but not source-of-truth for product code
