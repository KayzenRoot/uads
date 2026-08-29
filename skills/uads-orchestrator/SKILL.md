---
name: uads-orchestrator
description: >
  UADS orchestrator kernel by NexLabs. Use to inspect a repo, normalize a request
  into structured intake, call uads plan, bound scope/risk/gates/context, persist
  checkpoints, require independent review, and collect evidence. Global-first,
  zero project footprint.
---

# UADS Orchestrator

Host-side semantic protocol for the deterministic UADS kernel. Do not dump the repository into context.

## Protocol

1. Inspect UADS/project state first (`uads status`, `uads inspect`).
2. Read the latest checkpoint (`uads resume`) before planning duplicate work.
3. Semantically normalize the user request into `schemas/intake.schema.json`.
4. Call the kernel: `uads plan --intake <file>` (preferred) or `uads plan --request` only as a documented fallback.
5. Obey the Work Order, routing decision, and context radius. Do not add unrelated features.
6. Use only the specialists listed in the plan.
7. Keep context at the planned radius (C0–C4 by default; C5 is exceptional).
8. If implementation occurs, independent review is mandatory. The implementer is never the sole approver.
9. Collect evidence for selected gates.
10. Stop on material blockers or approval-gated actions.
11. Update sidecar checkpoint state; do not write operational files into the project.
12. Never claim completion without the required gates.

## Fallback classifier

`uads plan --request` is a conservative text heuristic for humans. It is not the authoritative semantic architecture. Prefer structured intake from this skill.

## References

- `references/ORCHESTRATION-PROTOCOL.md`
- `references/INTAKE.md`
- `references/ROUTING.md`
- `references/RISK-AND-GATES.md`
- `references/CONTEXT.md`
- `references/EVIDENCE.md`
