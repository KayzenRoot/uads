# 12 — Review bundle

## Purpose

Produce an **external-audit** ZIP of a project snapshot without secrets, heavy artifacts, or host-identifying paths.

## How to generate

Capture gates into the sidecar, then package:

```bash
node scripts/validate/capture-evidence.mjs
uads review
# or
node scripts/review/create-review-bundle.mjs
node scripts/review/inspect-review-bundle.mjs <zip>
```

Output (outside the project):

```
~/.uads/workspaces/<project-id>/reviews/uads-review-<project-id>-<timestamp>.zip
~/.uads/workspaces/<project-id>/reviews/uads-review-<project-id>-<timestamp>.zip.sha256
```

Validation evidence is stored in the sidecar (`.../evidence/`), never in git.

## ZIP contents

- `review-manifest.json` (privacy-minimized; see `schemas/review-manifest.schema.json`)
- `repository-tree.txt`
- `git-status.txt`, `git-diff.txt`, `git-log.txt`
- `version.txt`, `README.txt`
- `evidence/validation-summary.json` and per-command outputs
- `project/` — included source/docs/configs after sanitization

The shareable manifest uses `repositoryName`, `projectId`, and `sidecar://workspaces/<project-id>`. It does not include absolute `repoRoot` or sidecar filesystem paths.

## Secret handling (defense-in-depth)

Filename exclusion is not enough. Before any text is archived, UADS:

- strips credential userinfo from Git remotes
- redacts high-confidence secret signatures (private keys, common token formats)
- redacts host home paths
- omits a file when it cannot be sanitized, recording a non-sensitive skip reason

This is not a guarantee of complete secret detection.

## Must exclude

- `.env*`, private keys, tokens, credential filenames
- `node_modules/`, `.git/`, `dist/`, coverage, caches
- `memory-bank/` (session state)
- review output directories
- absolute local paths in the shareable manifest

## Checksum and inspection

SHA-256 of the ZIP bytes is written beside the archive. Post-generation inspection reopens the ZIP and checks required entries, exclusions, manifest privacy, and fixture-secret absence.
