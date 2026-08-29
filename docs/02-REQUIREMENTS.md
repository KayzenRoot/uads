# 02 — Requirements

Normative requirements for UADS (NexLabs). Architecture Freeze v0.2.

## Functional (foundation)

| ID | Requirement |
| --- | --- |
| F1 | Identify the current git repository root from cwd |
| F2 | Compute a stable project fingerprint and project-id |
| F3 | Create/read a global sidecar under `~/.uads/workspaces/<project-id>/` |
| F4 | Default to zero project footprint |
| F5 | CLI commands: `--help`, `doctor`, `status`, `review` |
| F6 | Generate a review ZIP outside the project with SHA-256 checksum |
| F7 | Exclude secrets and heavy/generated directories from review ZIPs |
| F8 | Global install skeleton populates `~/.uads/{core,skills,agents,workspaces}` without silent overwrites |
| F9 | Agent Skill entrypoint exists at `skills/uads-orchestrator/SKILL.md` |
| F10 | JSON schemas exist for checkpoint, work order, evidence, review, profile, repository map |

## Non-functional

| ID | Requirement |
| --- | --- |
| NF1 | Portable CLI (Node.js 20+); no proprietary runtime for basics |
| NF2 | Open-source ready (Apache-2.0, governance docs) |
| NF3 | Security-conscious packaging of review artifacts |
| NF4 | Token-aware architecture documented even before the orchestrator exists |
| NF5 | Foundation is tested; CI must pass |

## Future (not Prompt 001)

Full orchestrator, specialist agents, multi-agent delegation, Skill registry, marketplace, dashboard, cloud control plane, deep UGAS integration.
