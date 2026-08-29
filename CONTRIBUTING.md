# Contributing to UADS

UADS is an open-source project by **NexLabs**, licensed under Apache License 2.0.

## Ground rules

1. Read `docs/04-ARCHITECTURE.md` (Architecture Freeze v0.2) before large changes.
2. Keep **global-first** and **zero project footprint** defaults.
3. Do not package secrets into review bundles.
4. Extra ideas go to `docs/14-BACKLOG.md`, not into Prompt 001 scope.
5. Evidence-first: include commands/outputs for behavioral claims.

## Development

```bash
npm install
npm run build
npm test
npm run validate
```

## Pull requests

Use the PR template. Keep diffs focused. Do not commit `.env`, keys, or generated `dist/` unless a release process later requires it (this repo gitignores `dist/`).

## Code of conduct

See `CODE_OF_CONDUCT.md`.
