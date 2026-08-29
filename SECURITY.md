# Security Policy

UADS is maintained by **NexLabs**.

## Supported versions

The `main` branch and the latest published version (currently `0.1.0` foundation) receive security fixes.

## Reporting a vulnerability

Do **not** open a public issue for exploitable vulnerabilities.

1. Email or privately contact the NexLabs maintainers via GitHub security advisories on https://github.com/KayzenRoot/uads
2. Include reproduction notes, affected version, and impact
3. Do not attach secrets, private keys, or production credentials

## Review bundles

`uads review` must never include `.env*` files, private keys, tokens, or credential dumps. Git remotes are stripped of userinfo. High-confidence secret signatures and absolute host paths in source, diffs, and evidence are redacted. Ordinary source files are not omitted merely because their names mention secrets. Filename exclusion alone is not sufficient. The delivered ZIP is inspected after its final write. If you find a packing or redaction bypass, report it as a vulnerability.

Content scanning is defense-in-depth, not a guarantee of complete secret detection.

## Installer safety

Install scripts skip existing destination files unless `--force` / `-Force` is passed. Report overwrite or path-traversal issues privately.
