# Releasing UADS

UADS uses a reproducible SemVer 2.0.0 release lifecycle. The project is pre-1.0: PATCH fixes a compatible defect, MINOR adds a compatible capability, and MAJOR is reserved for the post-1.0 breaking-change policy. Pre-release identifiers use normal SemVer suffixes such as `-rc.1`. `CHANGELOG.md` is curated and authoritative; generated GitHub notes are supplementary.

## Sources of truth and invariants

For a current release, `package.json`, `VERSION`, and the root package-lock entry must contain the same version. The immutable tag is `vX.Y.Z`. A tag is never moved, force-pushed, or reused for another commit. Historical releases are explicitly marked as retrospective and use the original canonical commit; they are not rebuilt as historical binaries.

## Release gate

From a clean `main` checkout whose commit is already on `origin/main`:

```bash
npm ci
npm run release:validate -- --output tmp/release-validation-report.json --ci-binding tmp/ci-binding.json
npm run release:verify -- 0.7.0 --ci-binding tmp/ci-binding.json
npm run release:build -- 0.7.0 --output release --validation-report tmp/release-validation-report.json
npm run release:publish -- 0.7.0 --artifacts release
```

The canonical GitHub Actions workflow is `.github/workflows/release.yml` and accepts a manual `X.Y.Z` input. It validates the exact successful Foundation CI run, runs the complete local gate, builds the npm tarball, SPDX SBOM, validation report, release manifest, and SHA-256 checksums, then creates an immutable pre-release and uploads those assets. UADS is not published to npm.

## Historical reconstruction

`npm run release:historical` verifies the canonical v0.1.0-v0.6.0 commit/version map, creates missing annotated tags without force, and creates transparent retrospective pre-releases. Any tag conflict stops the operation.

## Rollback, yank, and deprecation

Never retag a commit. If a release is defective, publish a corrective patch, mark the affected GitHub release with a clear warning, and deprecate the affected line in the changelog. Deleting or replacing tags/releases requires an explicit conflict-resolution decision and is not automated. Release assets are immutable evidence; checksums and SBOMs must be regenerated only for a new release.

## Security and provenance

The release workflow uses least-privilege permissions, immutable action pins, and no stored credentials. SHA-256 covers every uploaded asset except the checksum file itself. Artifact attestation is attempted when GitHub supports it; unsupported or plan-gated provenance is reported as a limitation rather than fabricated.
