# Engineering Decisions Ledger

This ledger is repository governance, not UADS runtime state. Entries are append-only in normal use. A correction to a decision gets a new entry and points to the superseded entry.

## DEC-ENG-001 — Adopt a static protocol layer

- Status: `PROPOSED`
- Work Order: `ENG-PROTOCOL-ADOPTION-001`
- Decision: Keep UADS operational state in the global sidecar and add `.engineering/` only for static contracts, adoption records, and review evidence.
- Rationale: The existing Architecture Freeze requires global-first and zero project footprint, while this increment explicitly requires repository-visible governance.
- Alternatives rejected: moving runtime checkpoints into the repository; duplicating the existing `docs/` canon under a new naming scheme.
- Evidence: `docs/04-ARCHITECTURE.md`, `docs/05-STATE-AND-CHECKPOINT.md`, `.engineering/PROTOCOL.md`.

## DEC-ENG-002 — Extend existing GitHub governance in place

- Status: `PROPOSED`
- Work Order: `ENG-PROTOCOL-ADOPTION-001`
- Decision: Extend the existing PR template, issue templates, and Foundation CI instead of changing required branch-protection contexts or replacing workflows.
- Rationale: Remote audit shows `Foundation checks` is the required status context and existing security/release workflows are active.
- Evidence: `.github/pull_request_template.md`, `.github/workflows/ci.yml`, `GOVERNANCE.md`, baseline GitHub audit in the Evidence Bundle.

## DEC-ENG-003 — Inventory before deletion

- Status: `PROPOSED`
- Work Order: `ENG-PROTOCOL-ADOPTION-001`
- Decision: No production file, dependency, migration, endpoint, job, flag, configuration, or public contract is removed by this increment.
- Rationale: Static absence is not proof of runtime absence in an extensible orchestration project.
- Evidence: `.engineering/reports/CLEANUP-INVENTORY.md` and `.engineering/PROTOCOL.md`.

