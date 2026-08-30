# 08 — Security

UADS by NexLabs treats review packaging and installers as security-sensitive even at foundation stage.

## Non-negotiable

- Do not write secrets into the sidecar, Work Orders, routing decisions, checkpoints, execution runs, evidence, reviews, or review ZIP
- Intake-derived free text is redacted with the shared high-confidence sanitizer before durable writes; errors must not echo raw secrets
- Exclude `.env*`, private keys, tokens, credential filenames, and `memory-bank/`
- Exclude `.git/` (history can contain secrets)
- Sanitize Git remotes (strip userinfo) before they enter a shareable manifest
- Redact high-confidence secret signatures **and** absolute host paths in source, diffs, evidence, and generated review text
- Do not exclude ordinary source/docs/tests just because the filename contains `secret` / `token` / `password` / `credential`
- Do not serialize absolute host paths into the shareable review manifest or ZIP text
- Installers must not overwrite user files without `--force` / `-Force`
- Execution state uses relative project paths only; `../`, drive paths, and UNC paths are rejected
- Index/graph/impact/Context Pack artifacts reject traversal, symlink escape, `.env`/credential content, and absolute host paths
- Corrupt index/graph JSON is not treated as current; `uads index` rebuilds, impact/pack/diagnosis fail closed until a valid complete index exists
- Failure text is sanitized before persist; signatures and Failure Memory must not store raw secrets or host paths
- `--input` for `uads failure record` must be an ordinary file inside the repository or current project sidecar; symlink targets that resolve outside those roots are rejected before read, and the input is not copied into review ZIPs
- Dirty worktrees block dispatch; the engine never reset/stash/cleans user files
- Implementer cannot self-approve; the implementer session is bound at dispatch and cannot be invented during review
- Change digest hashes actual changed file bytes (including untracked binaries); Git paths are parsed with NUL-delimited porcelain
- Cache files are untrusted persisted data: schema-validate before trust, reject id/path traversal, never execute stored command text, never cache raw secret-bearing output
- Cross-project cache records cannot be persisted into or satisfy another project's gates
- Review ZIP cache/cost summaries contain counts and reason codes only; no raw command output or sidecar filesystem paths

Content scanning is **defense-in-depth**, not a claim of complete secret detection.

## Threat notes (foundation)

| Surface | Risk | Mitigation |
| --- | --- | --- |
| Review ZIP | Secret leakage via path, diff, source, or evidence | Path exclusion + URL sanitization + high-confidence redaction + tests |
| Review ZIP | Host path disclosure | Privacy-minimized manifest + path redaction |
| Installer | Overwrite of `~/.uads` | skip-existing default |
| Installer | Unusable CLI | npm prefix install + verification of `uads --help` / `doctor` |
| Fingerprint | Path vs remote mismatch | Prefer sanitized origin URL |

## Reporting

See `SECURITY.md`.
