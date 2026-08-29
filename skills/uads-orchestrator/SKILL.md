---
name: uads-orchestrator
description: >
  UADS orchestrator by NexLabs. Invoke when planning or implementing software with
  architecture discipline, quality gates, security and performance verification,
  evidence-based delivery, and a review ZIP for external audit. Global-first,
  zero project footprint by default.
---

# UADS Orchestrator

Use this skill when work needs orchestration rather than a one-shot code edit.

## When to invoke

- Architecture, multi-file, or cross-cutting changes
- Quality, security, or performance verification is required
- The user asks for evidence, audit, or a review bundle
- Scope is unclear and must be classified before editing

Do not invoke for trivial single-file edits with no verification need.

## Global-first behavior

UADS installs and stores operational state under `~/.uads/`, never inside the managed project by default.

```
~/.uads/core
~/.uads/skills
~/.uads/agents
~/.uads/workspaces/<project-id>/
```

Identify the git root, compute a stable project fingerprint, and use `~/.uads/workspaces/<project-id>/` as the sidecar.

## Zero project footprint

Do not write UADS cache, work orders, checkpoints, indexes, or review ZIPs into the project unless the user explicitly opts in. Project files change only as the requested product work.

## Checkpoint / state discipline

- Persist resume state in the sidecar, not in git.
- After each meaningful phase, record what completed, what remains, and the next action.
- On resume, read the latest checkpoint before repeating work.

## Scope classification

Classify before large edits: `trivial` | `local` | `cross-cutting` | `architectural`.

Expand context radius only as far as the class requires.

## Context radius policy

Send the smallest sufficient context. Prefer repository map + targeted files over dumping the tree. Cache derived maps in the sidecar (cache-first prompting).

## Quality gates

Do not claim completion without the relevant gates: lint/typecheck, tests, security-sensitive review, and performance checks when the change can affect them.

## Evidence requirements

Every completion claim needs a command, output, or file. If evidence is missing, the work is not done.

## Review ZIP

Run `uads review` (or `scripts/review/create-review-bundle.*`). Output goes to `~/.uads/workspaces/<project-id>/reviews/` with a SHA-256 checksum. Secrets, `.git/`, `node_modules/`, and caches must be excluded.

## Stop conditions

Stop and report blocked when: repository is inaccessible; required credentials are missing; a destructive action outside the repo would be required; or acceptance criteria cannot be met without new product decisions.

Deeper rules live in `docs/` (Architecture Freeze v0.2).
