# GEF V1 W0 module boundary

This directory owns the native Global Engineering Fabric bootstrap contracts
and global project registry. It is deliberately small and metadata-first.

- `contracts.ts` owns closed TypeScript contracts, canonical serialization,
  digest calculation, and the 27-component gap catalog.
- `paths.ts` owns the `~/.uads/gef/` path contract and atomic-layout
  preparation. It delegates home resolution to the existing UADS sidecar
  path abstraction.
- `source.ts` owns read-only repository identity and profile discovery. It
  reuses the existing Git summary and project fingerprint helpers and never
  persists the absolute repository path.
- `registry.ts` owns schema validation, atomic profile/current/gap writes,
  classification, read-only status, and doctor checks.
- `commands/gef.ts` exposes the bounded CLI surface; it never invokes a
  provider or executes project commands.

W0 does not implement source drift authority, UPIR compilation, context
compilation, proof carry-forward, hosted gate collection, Shadow Assurance,
or authoritative test/proof skipping. Those remain explicitly staged for
later waves. `SHADOW_PLANNED` is descriptive only and always records
`authoritativeSkippingEnabled: false`.
