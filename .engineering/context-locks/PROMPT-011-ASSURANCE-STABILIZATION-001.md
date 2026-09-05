# Context Lock — `PROMPT-011-ASSURANCE-STABILIZATION-001`

State: `RELOCKED`
Repository: `KayzenRoot/uads`
Baseline Git SHA: `2cd8fde252737f31a24cd5b13ed766675fd40d3f`
Generated at: `2026-09-04T00:00:00.000Z`

## Required fingerprints

| Source | Relative path or deterministic sentinel | SHA-256 |
| --- | --- | --- |
| Checkpoint | `.engineering/checkpoints/CHECKPOINT-DELTA-PROMPT-011-ASSURANCE-STABILIZATION-001.md` | `fff1be5468d0136a1f5fa7dc0a6bf32c7d5ebf19d4258bdc928ed3c3f4494036` |
| Decisions | `.engineering/DECISIONS.md` | `eacbe3d47b1295561d9673338d2580c305575286fb01a95859c975c2176e1e6a` |
| Scope | `.engineering/work-orders/PROMPT-011-ASSURANCE-STABILIZATION-001.md` | `825a963f87729befc4ca2e0f47fb6c842039b1afcfb8155a7d1f6dc25f0ff79b` |
| Definition of Done | `docs/13-DEFINITION-OF-DONE.md` | `fb92a45e7a5233e82fc48d2e731b312ebfb4100394d76bcfaee6b99f90ff6c57` |
| Architecture | `docs/04-ARCHITECTURE.md` | `575e46f741a47a2227bf13e6dab21d882cde2a494a4aa7a4ec4385eb8dc61ca0` |
| Project overview | `README.md` | `fb3dcb8a051dc68b9fcd19f7a048c16205d90e326292017b40fc3d34d0aed8b3` |
| Governance | `GOVERNANCE.md` | `5c45d9f54aba5c08f8fa6e2f84eeee8ead92af34ccca582ccbc1dafd08c4bb68` |
| Quality gates | `docs/07-QUALITY-GATES.md` | `751d8dde295c5fc696516ffcfe2b0404048cfb6aa380189e1401141d6e6d97a6` |
| Executor rules | `.cursorrules` | `7c70f6d93d061f986ea1a0079faa6bf88c0d88504123807694526d7b2a87a711` |
| Delivery protocol | `.engineering/PROTOCOL.md` | `f1ccaf41ae75ba578ed0d548e0d601ed56fe30dd0eff9d7cef00028ec71a60cf` |
| Assurance policy | `src/kernel/assurance-policy.ts` | `3cd7adee881cc68aa800e9e1931595b45e62276857ce031f8fff51f3874daba6` |
| Execution seam | `src/kernel/execution.ts` | `1eb7df8f977df62d15aa5c0322525e4670cbbfcba4c06a2a38b5c7443735f6f0` |
| Direct Review seam | `src/github/direct-review.ts` | `88f5616a76ec6b70b3a64239b6b49c0f0b5a8a45c5de1125b44bcbf7dc97d198` |
| Review packet schema | `schemas/review-packet.schema.json` | `c109d6da98d537375635463acc9112071b20d15f33b39298af1341773a0e81f0` |
| Compatibility schema | `schemas/compatibility-evidence.schema.json` | `23511445a029266c92abe4d9c9455f2f8a155d3572afde1235404ccfe78f792d` |
| Compatibility workflow | `.github/workflows/compatibility.yml` | `41fdd64b75526a6ac09f708457dee3c177dc99cf50e60530cea5d9593fba825a` |
| Assurance eval | `src/eval/assurance.ts` | `1229811d750b70bcd322808cc679a74fc19de5c60d27513a5ab24a9e9be6a522` |
| Fault-injection eval | `src/eval/fault-injection.ts` | `c45b94a5a57617f78d9ff81e03ca71e9c717aa9d203325672e9a744783eea3f7` |
| Evidence Bundle | `.engineering/reports/EVIDENCE-BUNDLE-PROMPT-011-ASSURANCE-STABILIZATION-001.md` | `3553721a3db3c5d45fe2a11612cb4942c3d97cdda814d88926a1846e6696b6f2` |

## Stale events

Record every critical source change after the lock. Do not continue silently.

- Source: Prompt 011 implementation, schemas, evals, workflows, release metadata, and documentation
- Reason: critical sources changed after the initial `FRESH` lock was created
- Action: stopped the initial flow, re-inspected the changed source set, recomputed SHA-256 fingerprints, and relocked before final validation
- Source: Prompt 011 correction implementation and evidence records
- Reason: C1-C4 correction blockers changed assurance authority, normative FI coverage, compatibility artifact identity, findings-file safety, and their documentation
- Action: committed implementation at `12b70f9d0fc54bce87dcfe31fc3b4cae59b09a56`, fixed the Windows tree-proof shell portability at `3e06aa9d1fdcdee371b1d4cca41222d052072d5f`, recorded hosted correction evidence at `4061946f301ff5b7ce5d3f0ddc231ab1a87cce09`, and relocked before final evidence validation

## Relock evidence

- Re-inspection commands: `git status --short`, `git diff --check`, targeted `rg` review, `npm run typecheck`, `npm run build`, all legacy/new evals, AS1-AS22, normative FI1-FI16 plus legacy FI17-FI32, CLI smoke, `npm ci`, `npm audit --audit-level=high`, `npm pack --dry-run`, and the engineering/skills/actions/Direct Review/CI receipt validators. The corrected full Vitest run completed with 47 files/329 tests and 0 failures.
- New lock or reason blocked: `RELOCKED`; corrected source and documentation fingerprints match the locked set. C5 is resolved: Dependency Review attempt 2 passed after Dependency Graph enablement on the exact hosted correction SHA.
