# GEF V1 Native Implementation - W0

W0 bootstraps the Global Engineering Fabric as global, metadata-first
infrastructure. It registers a repository by governed remote identity,
canonical UADS project ID, and repository generation rather than by local
folder name. The resulting profile is path-safe and stored below
`~/.uads/gef/`; the managed project receives no operational GEF state.

## Implemented

- Closed `gef-project-profile`, `gef-current`, and `gef-adoption-gap` schemas.
- Global GEF storage paths under the existing UADS home resolver.
- Stable project identity that survives relocation of the same Git repository.
- Global Project Registry with atomic, schema-validated profile/current/gap
  records.
- `NEW_PROJECT`, `PARTIALLY_GOVERNED`, and `EXISTING_PROJECT` classification.
- Read-only `status`, `profile show`, and `doctor` commands.
- `adopt --shadow` records an observational plan only; it never enables
  authoritative skipping.
- Explicit W0-to-W8 adoption gap matrix with only GEF-01 implemented.

## Reuse and boundaries

W0 reuses `resolveUadsHome`, `computeProjectFingerprint`, `readGitSummary`,
`atomicWriteJson`, and AJV schema validation. Existing UADS workspace,
checkpoint, evidence, model, specialist, and host-adapter state remain
authoritative and are not duplicated. GEF stores only bounded metadata and
does not call providers, execute project commands, or create approval proof.

The following remain staged: Source Drift Sentinel, UPIR/context/prompt
compilers, deterministic evidence and proof engines, HEDS delta packaging,
hosted receipts, cache families, telemetry, Shadow Assurance, adoption
migration automation, and dogfood. W0 therefore cannot claim `READY`.

## CLI

```text
uads gef status [--project <path>] [--json]
uads gef adopt [--project <path>] [--shadow] [--json]
uads gef profile show [--project <path>] [--json]
uads gef doctor [--project <path>] [--json]
```

`status` and `doctor` are read-only. `adopt` is the only W0 command that
creates global GEF records. All records are written atomically and validated
before persistence.
