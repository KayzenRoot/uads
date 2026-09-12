# Context Lock: UADS-GEF-V1-NATIVE-IMPLEMENTATION / W0

Base source identity: `312e32946798eb3abbb49a79af08e13efb7719dc`
Base source tree: `b2a6763045fc1dbb81b6ba2880bf1f77167d7133`
Active branch: `codex/gef-v1-w0`
Active functional PR: no open PR #77 found during source-first preflight.

## Locked source boundaries

- Existing global UADS home and workspace APIs in `src/lib/workspace.ts`.
- Existing project fingerprint normalization in `src/lib/fingerprint.ts`.
- Existing Git summary and safe process invocation in `src/lib/git.ts` and
  `src/lib/exec.ts`.
- Existing atomic JSON and AJV validation contracts.
- Existing CLI remains provider-neutral and does not execute providers.

## W0 authority boundary

The W0 GEF registry records metadata only. It cannot authorize execution,
proof reuse, test skipping, merge, or release. Later waves must preserve this
fail-closed boundary and revalidate source identity before acting.
