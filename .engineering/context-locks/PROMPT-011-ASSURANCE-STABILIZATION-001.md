# Context Lock — `PROMPT-011-ASSURANCE-STABILIZATION-001`

State: `RELOCKED`
Repository: `KayzenRoot/uads`
Baseline Git SHA: `2cd8fde252737f31a24cd5b13ed766675fd40d3f`
Generated at: `2026-09-04T00:00:00.000Z`

## Required fingerprints

| Source | Relative path or deterministic sentinel | SHA-256 |
| --- | --- | --- |
| Checkpoint | `.engineering/checkpoints/CHECKPOINT-DELTA-PROMPT-011-ASSURANCE-STABILIZATION-001.md` | `b261322b0d9cf3f587fefce2eb9efa22c0565bf891b104888b5193e846c17517` |
| Decisions | `.engineering/DECISIONS.md` | `eacbe3d47b1295561d9673338d2580c305575286fb01a95859c975c2176e1e6a` |
| Scope | `.engineering/work-orders/PROMPT-011-ASSURANCE-STABILIZATION-001.md` | `cc1494742dbafbf449d5b5dc5a9c207f9cd91f1da6650e3a8b188e41c8d9a4a7` |
| Definition of Done | `docs/13-DEFINITION-OF-DONE.md` | `f664669b8638622865c601cf5d4c80da55d3e4540fe15c1f1b6e241832dc2ee8` |
| Architecture | `docs/04-ARCHITECTURE.md` | `575e46f741a47a2227bf13e6dab21d882cde2a494a4aa7a4ec4385eb8dc61ca0` |
| Project overview | `README.md` | `fb3dcb8a051dc68b9fcd19f7a048c16205d90e326292017b40fc3d34d0aed8b3` |
| Quality gates | `docs/07-QUALITY-GATES.md` | `2c4f8bdb74f9fe223bd3c3f01166255fc1cbe2abbe68cf5cdd31fd2c4d236b61` |
| Executor rules | `.cursorrules` | `7c70f6d93d061f986ea1a0079faa6bf88c0d88504123807694526d7b2a87a711` |
| Delivery protocol | `.engineering/PROTOCOL.md` | `f1ccaf41ae75ba578ed0d548e0d601ed56fe30dd0eff9d7cef00028ec71a60cf` |
| Assurance policy | `src/kernel/assurance-policy.ts` | `3be385cb17846f878726967912cab57dd5af123ce040fdef1a57739765816f6e` |
| Execution seam | `src/kernel/execution.ts` | `176e9fe45a24c49a549bf823223b7cd6883e516afac9bcbd18e358914cd83f28` |
| Direct Review seam | `src/github/direct-review.ts` | `1595056242481a1898b097682d7b25c8e5453789d6d4fcdb96a0e86ab328e4d0` |
| Review packet schema | `schemas/review-packet.schema.json` | `c109d6da98d537375635463acc9112071b20d15f33b39298af1341773a0e81f0` |
| Compatibility schema | `schemas/compatibility-evidence.schema.json` | `b456cfa832fa9d01fe5c977443639f34df0331a57dcdcb4d911748806546cd42` |
| Compatibility workflow | `.github/workflows/compatibility.yml` | `60a0d3afe43d1aa67cd756b91ae8c9afba92fab07368b755f8c39e142dd63a34` |
| Assurance eval | `src/eval/assurance.ts` | `825c998d9b91a2b03f8801e0419617969a4c21157fa78200ed1947db7a277935` |
| Fault-injection eval | `src/eval/fault-injection.ts` | `b7c03fa6eb91d46604fb2c6d1205581d5e6f343e92338fad4f5579c4effc87ed` |
| Evidence Bundle | `.engineering/reports/EVIDENCE-BUNDLE-PROMPT-011-ASSURANCE-STABILIZATION-001.md` | `c9c5165a3fa8dd05ac671c52c34fd3d71acf26751c1d424d525302d37c9eafa7` |

## Stale events

Record every critical source change after the lock. Do not continue silently.

- Source: Prompt 011 implementation, schemas, evals, workflows, release metadata, and documentation
- Reason: critical sources changed after the initial `FRESH` lock was created
- Action: stopped the initial flow, re-inspected the changed source set, recomputed SHA-256 fingerprints, and relocked before final validation

## Relock evidence

- Re-inspection commands: `git status --short`, `git diff --check`, targeted `rg` review, `npm run typecheck`, `npm run build`, focused Vitest, the full 47-file/329-test Vitest run, all legacy/new evals, CLI smoke, `npm ci`, `npm audit --audit-level=high`, `npm pack --dry-run`, and the engineering/skills/actions/Direct Review/CI receipt validators.
- New lock or reason blocked: `RELOCKED`; all foundation component gates passed. The first aggregate wrapper was interrupted during `eval:fault` by user follow-up; the missing family and remaining wrapper commands were rerun successfully and are described in the Evidence Bundle.
