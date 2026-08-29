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
- Dirty worktrees block dispatch; the engine never reset/stash/cleans user files
- Implementer cannot self-approve; reviewer session must differ from implementer session

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
