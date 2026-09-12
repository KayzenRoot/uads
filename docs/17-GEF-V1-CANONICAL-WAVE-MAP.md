# GEF V1 Canonical W0-W8 Wave Map

Status: `GOVERNANCE_ONLY`
Owning Work Order: `ENG-UADS-GEF-V1-W0-001`

This is the canonical detailed component assignment for the GEF V1 program.
Issue #27 contains only the compact projection of this map. Component IDs,
names, wave ownership, and W0 status must be changed here first by a governed
Work Order; later implementation waves must not be inferred from this map.

| Wave | Components | Scope boundary |
| --- | --- | --- |
| W0 | GEF-01 | Global Project Registry and bounded adoption/status/doctor skeleton only. |
| W1 | GEF-02, GEF-03, GEF-04, GEF-05, GEF-06, GEF-07, GEF-08 | Source drift, UPIR/context/decision/prompt compilation and budget surfaces; no execution authority. |
| W2 | GEF-09, GEF-11 | Deterministic work plane and machine evidence engine; existing validators remain authoritative. |
| W3 | GEF-10, GEF-12, GEF-13, GEF-14 | Test impact, proof dependency, Merkle review, and HEDS delta packaging. |
| W4 | GEF-15, GEF-25, GEF-26 | Gate receipts, bounded orchestration, and CI impact/sharding; required gates cannot be weakened. |
| W5 | GEF-16, GEF-17, GEF-18, GEF-19, GEF-20, GEF-21 | Receipt/failure/negative-capability/architecture/playbook/warm-start registries. |
| W6 | GEF-22, GEF-23 | Telemetry and observational prompt tuning; no secret or source-body capture. |
| W7 | GEF-24, GEF-27 | Shadow Assurance and deeper adoption/bootstrap migration; authoritative skipping remains prohibited until independently promoted. |
| W8 | cross-wave closeout | Cross-platform hardening, exact-head closeout, and final governance reconciliation; no new component ID. |

## Component register

| ID | Component | Wave | W0 state |
| --- | --- | --- | --- |
| GEF-01 | Global Project Registry | W0 | IMPLEMENTED |
| GEF-02 | Source Drift Sentinel | W1 | STAGED |
| GEF-03 | UPIR Compiler | W1 | STAGED |
| GEF-04 | Context Compiler | W1 | STAGED |
| GEF-05 | Decision Capsule | W1 | STAGED |
| GEF-06 | Patch Recipe Compiler | W1 | STAGED |
| GEF-07 | Budget Governor | W1 | STAGED |
| GEF-08 | Executor Prompt Compiler | W1 | STAGED |
| GEF-09 | Deterministic Work Plane | W2 | STAGED |
| GEF-10 | Test Impact Router | W3 | STAGED |
| GEF-11 | Machine Evidence Engine | W2 | STAGED |
| GEF-12 | Proof Dependency Graph | W3 | STAGED |
| GEF-13 | Review Merkle Ledger | W3 | STAGED |
| GEF-14 | HEDS Delta Packager | W3 | STAGED |
| GEF-15 | Gate Receipt Collector | W4 | STAGED |
| GEF-16 | Command Receipt Cache | W5 | STAGED |
| GEF-17 | Failure Fingerprint Cache | W5 | STAGED |
| GEF-18 | Negative Capability Cache | W5 | STAGED |
| GEF-19 | Architecture Question Cache | W5 | STAGED |
| GEF-20 | Engineering Playbook Registry | W5 | STAGED |
| GEF-21 | Warm-Start Capsule | W5 | STAGED |
| GEF-22 | Telemetry Engine | W6 | STAGED |
| GEF-23 | Prompt Auto-Tuner | W6 | STAGED |
| GEF-24 | Shadow Assurance Engine | W7 | STAGED |
| GEF-25 | Zero-Wait Orchestrator | W4 | STAGED |
| GEF-26 | CI Impact/Shard Planner | W4 | STAGED |
| GEF-27 | Adoption/Bootstrap Engine | W7 | STAGED |

The W0 implementation remains limited to GEF-01 and the global metadata-only
contract skeleton. This map does not authorize implementation, skipping,
promotion, merge, release, or W1 commencement.
