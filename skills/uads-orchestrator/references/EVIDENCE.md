# Evidence

Completion requires commands, outputs, or files for selected gates.

Sidecar evidence lives under `~/.uads/workspaces/<project-id>/evidence/` (foundation) and `execution-runs/<id>/evidence/` (execution ledger).

Execution evidence is bound to the current change digest. Stale digest records do not satisfy finalization. Command PASS is incompatible with a non-zero exit code. `uads evidence record` stores results; it does not execute the command.
Review bundles remain privacy-minimized and are inspected on their final bytes.

Stop if evidence cannot be produced or an approval-gated action is required.
