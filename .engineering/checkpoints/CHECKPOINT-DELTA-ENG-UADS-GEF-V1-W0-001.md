# Checkpoint Delta - `ENG-UADS-GEF-V1-W0-001`

Status: `PROPOSED`
Canonical promotion: `PENDING_MAINTAINER`

Before: W0 candidate `9a075d0` had passed hosted gates but HEDS returned three
HIGH correction findings: identity, package-manager command metadata, and
missing CLI end-to-end coverage.

After proposed: the replacement candidate normalizes identity, adds bounded
package-manager metadata, proves every public CLI surface end-to-end, and
records the canonical W0-W8 map. Only GEF-01 and the W0 contract skeleton are
implemented; GEF-02 through GEF-27 remain staged.

## Completed

- Source-first preflight recorded reviewed base/head/tree and PR #29 state.
- Existing infrastructure was reused rather than duplicated.
- Stable remote-plus-canonical-project-plus-repository-generation identity was
  implemented and tested across path relocation.
- Profile/current/adoption-gap records are closed, digest-bound, atomic, and
  path-safe.
- `SHADOW_PLANNED` remains observational with authoritative skipping disabled.
- Focused tests cover registration, relocation, package-manager commands,
  read-only status, moved head, corruption fail-closed behavior, privacy, and
  built-CLI integration.

## Required next gate

Push the replacement candidate, collect exact-head required hosted gates, and
obtain independent HEDS approval. The Portuguese executor report must carry
the corrected head/tree and hosted run/job identities; no evidence-only source
commit may follow those checks. PR #29 remains open until the replacement PR
is open; no executor merge or closeout is permitted.
