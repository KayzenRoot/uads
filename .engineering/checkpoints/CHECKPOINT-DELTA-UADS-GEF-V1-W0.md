# Checkpoint Delta: UADS-GEF-V1-NATIVE-IMPLEMENTATION / W0

Status: `COMPLETE_CANDIDATE`

Before: UADS already had a global-first sidecar, project fingerprint,
provider-neutral CLI, and evidence/review contracts, but no native GEF
registry or adoption surface.

After: W0 adds a global, schema-validated Project Registry and bounded GEF
status/doctor/adopt/profile CLI surfaces. The managed project receives no
operational GEF state. Only GEF-01 and the W0 storage/contract skeleton are
implemented; GEF-02 through GEF-27 remain staged.

## Completed

- Source-first preflight recorded base commit/tree and active PR state.
- Existing infrastructure was reused rather than duplicated.
- Stable remote-plus-canonical-project-plus-repository-generation identity was
  implemented and tested across path relocation.
- Profile/current/adoption-gap records are closed, digest-bound, atomic, and
  path-safe.
- `SHADOW_PLANNED` remains observational with authoritative skipping disabled.
- Focused tests cover registration, relocation, read-only status, moved head,
  corruption fail-closed behavior, and privacy.

## Required next gate

Push the dedicated W0 candidate, collect exact-head required hosted gates, and
obtain independent HEDS approval. The final executor report must carry the
candidate head/tree and hosted run/job identities; no evidence-only source
commit may follow those checks.
