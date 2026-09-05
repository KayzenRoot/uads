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

## DEC-ENG-004 / ADR-PROMPT-012-HOST-EXECUTION-BOUNDARY-001 — Freeze one necessary next capability

- Status: `PROPOSED`
- Work Order: `ENG-PROMPT-012-HOST-EXECUTION-BOUNDARY-001`
- Decision: Select bounded, provider-neutral host execution and receipt handling as the sole NECESSARY Prompt 012 capability. The future implementation may deepen the existing Cursor, Codex, and Generic Agent Skills handoff only after the current Host Dispatch Bundle has passed all identity and ownership checks.
- Necessity evidence: `ROADMAP.md` explicitly identifies “Cursor adapter depth + generic/Codex execution” as the third staged next increment; current `docs/11-ADAPTERS.md` and `src/adapters/host-dispatch.ts` stop at sidecar-only bundle preparation; `docs/02-REQUIREMENTS.md` F24 defines preparation but no execution/receipt contract. Without this boundary, the staged adapter-depth item cannot progress from prepared handoff to verifiable host execution.
- Excluded candidates: UGAS is not a prerequisite for the adapter-depth roadmap item and remains FUTURE/OUT_OF_SCOPE; provider gateway, dashboard, marketplace, deployment, and deep specialist expansion remain unselected and excluded.
- Architecture rule: Keep Architecture Freeze v0.2. No bump is required while the implementation remains sidecar-only for operational state, provider-neutral in the kernel, explicit about host/provider/approval ownership, and fail-closed for stale, replayed, tampered, cross-project, or ambiguous handoffs.
- Required proof before implementation acceptance: strict receipt schema, bundle/execution identity binding, target-root ownership binding, replay/staleness/tamper rejection, bounded privacy-safe persistence, zero project footprint, explicit approval boundary, Linux/Windows adapter coverage, and complete local/external validation appropriate to the changed contract.
- Alternatives rejected: selecting deep UGAS integration because it is merely reserved on the roadmap; selecting a provider gateway because it violates the current provider-neutral boundary; selecting dashboard/marketplace/deployment because no current DoD requires them; selecting no capability because the roadmap has an objectively identified adapter-execution gap.
- Evidence: `ROADMAP.md`, `docs/02-REQUIREMENTS.md`, `docs/03-SCOPE.md`, `docs/04-ARCHITECTURE.md`, `docs/11-ADAPTERS.md`, `docs/13-DEFINITION-OF-DONE.md`, `integrations/ugas/README.md`, `src/adapters/host-dispatch.ts`, `schemas/host-dispatch-bundle.schema.json`, `tests/host-adapters.test.ts`, and the Prompt 011 final external audit recorded in GitHub PR #16 comment `5554582899`.
