# Governance

UADS is an open-source project by **NexLabs**.

## Roles

- **NexLabs** owns product direction, Architecture Freeze, and releases.
- **Maintainers** (see `.github/CODEOWNERS`) review PRs and issue triage.
- **Contributors** propose changes via pull requests.

## Decision making

Architecture Freeze documents in `docs/` are normative. Changes that alter global-first behavior, zero project footprint, evidence protocol, or review-ZIP secret exclusion require maintainer approval and a docs update.

## Versioning

UADS follows SemVer 2.0.0 while pre-1.0. `package.json`, the root `VERSION` file, and the package-lock root version must agree. `CHANGELOG.md` is the curated release history. Tags use immutable `vX.Y.Z` names.

## Main branch protection

Normal contributions go through pull requests with one approval, stale-review dismissal, code-owner review, resolved conversations, green `Foundation checks`, linear history, and no force pushes or deletion. Administrator enforcement is deliberately disabled so the verified NexLabs maintainer can continue the controlled construction workflow and recover from repository-level configuration failures. Signed commits and tags are not mandatory yet.

The exact remote state is audited by `npm run github:audit -- --output <sidecar-directory>`; permission- or plan-gated features are reported rather than assumed.

## Governed engineering delivery

Repository changes follow the static protocol in `.engineering/PROTOCOL.md`. Each increment has one Work Order identity, an exact pre-change baseline, a Context Lock with SHA-256 source fingerprints, an Evidence Bundle, and a proposed Checkpoint Delta. Existing `docs/` documents remain canonical; `.engineering/` records governance and review evidence but never replaces UADS runtime state in the global sidecar.

The first adoption is `ENG-PROTOCOL-ADOPTION-001` on branch `chore/eng-protocol-adoption-001`. Executors must inspect before editing, run the same validation before and after, stop on stale context or unbounded risk, and leave cleanup candidates in an evidence-backed inventory. Cleanup is never started automatically after adoption.

## Out of scope for informal PRs

Marketplace, cloud control plane, enterprise server, production Skill registry, and deep UGAS integration are roadmap items, not drive-by additions.
