# 11 — Adapters

UADS is adapter-shaped: the kernel remains provider-neutral and hosts bind
through one common contract at `src/adapters/`. Prompt 010 supports exactly:

- `cursor`
- `codex`
- `generic-agent-skills`

Adapters prepare and validate host state. They do not invoke model providers,
execute arbitrary commands, or become an autonomous gateway.

## Global targets

| Adapter | Global target | Resource |
| --- | --- | --- |
| Cursor | `~/.cursor/agents/` | UADS `uads-*.md` specialist descriptors |
| Codex | `~/.codex/agents/` | UADS `uads-*.md` specialist descriptors |
| Generic Agent Skills | `~/.agents/skills/uads-orchestrator/` | canonical UADS Skill tree |

`UADS_HOME` controls UADS state. `UADS_CURSOR_HOME`, `UADS_CODEX_HOME`, and
`UADS_AGENT_SKILLS_HOME` are explicit controlled/test overrides. Adapter state
under `~/.uads/adapters/<adapter>/` stores adapter-relative resource names and
hashes, never raw host paths, credentials, prompts, or environment dumps.

## Detection and capabilities

`uads adapters detect` is read-only and never creates a host directory. A
target is `SUPPORTED` only when its fixed host structure is present or an
explicit controlled home is supplied; otherwise it is `UNAVAILABLE`,
`UNPROVEN`, or `BLOCKED`. Version probing is intentionally not implemented,
so adapter version remains `null` rather than being fabricated.

Adapter capability data reuses the existing Runtime Capability Snapshot shape
and carries `provenance.source=adapter`. Unknown is not true. Generic Agent
Skills explicitly starts with `subagents=false` and `parallelAgents=false`;
Cursor and Codex do not claim those capabilities without proof. Model
capabilities still require the existing model/runtime intersection.

## Ownership-safe installation

`uads adapters install <adapter>` writes only fixed global targets. The common
installer:

- records source and installed SHA-256 hashes atomically;
- preserves unrelated files;
- refuses unmanaged `uads-*` collisions;
- refuses user-modified managed bytes;
- rejects traversal and symlink/junction escapes;
- rolls back host writes when a later write fails;
- is idempotent when canonical resources are unchanged.

`uads adapters uninstall <adapter>` removes only unchanged resources listed in
the ownership state. Modified or ambiguous resources survive and produce a
deterministic conflict. It never recursively removes a host directory.

## Host Dispatch Bundle

`uads adapters prepare <adapter>` reconstructs the current Work Order,
Routing Decision, Specialist Selection Plan, Model Execution Plan, Context /
Impact identity, runtime snapshot, and execution identity before writing a
sidecar-only `Host Dispatch Bundle`. The bundle contains role-scoped
assignments, dependency groups, gates, evidence obligations, risk, forbidden
scope, context references, token limits, and identity digests.

Host capability can narrow UADS execution: an unproven host serializes
parallel-eligible groups and uses role cycling instead of subagents. It may
never add specialists, assurance roles, gates, evidence, scope, parallelism,
or model quality. Stale, blocked, cross-project, tampered, or mismatched
artifacts fail closed.

## CLI

```text
uads adapters list
uads adapters detect [adapter]
uads adapters status [adapter]
uads adapters explain <adapter>
uads adapters install <adapter>
uads adapters uninstall <adapter>
uads adapters prepare <adapter>
```

JSON output is schema-shaped and omits raw host paths. `status` and `detect`
are non-installing operations. All three adapters use the same Skill + CLI
contract; a host that requires project-local files is outside this freeze.
# Specialist delegation contract

Adapters may invoke the lean `agents/uads-*.md` descriptors selected by the sidecar Specialist Selection Plan. The kernel emits role-specific assignments with objective, relevant affected areas/files/gates, evidence obligations, risk, forbidden scope, dependency group, and parallel eligibility. Adapters must not invent profiles, call providers from the kernel, execute approval-gated actions, or treat a stale/blocked plan as dispatch authorization.
