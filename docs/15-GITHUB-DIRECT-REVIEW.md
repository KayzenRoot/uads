# 15 — GitHub Direct Review Evidence

UADS records a machine-readable, sanitized proof of the exact GitHub Actions run used for a release. The proof is generated on the runner from GitHub-provided identity fields, the runner's git tree, stable step outcomes, and bounded parsers for test/evaluation/audit output.

## CI contract

`.github/workflows/ci.yml` assigns stable IDs to every required gate. Each command streams to the GitHub log while `pipefail` and `tee` capture parser input under the runner temporary directory. A final `if: always()` step runs `scripts/github/generate-direct-review-evidence.mjs`, emits the exact markers `UADS_DIRECT_REVIEW_BEGIN` and `UADS_DIRECT_REVIEW_END`, and writes `github-direct-review-evidence.json`.

The JSON is validated by `npm run validate:direct-review` and uploaded as the pinned `actions/upload-artifact` artifact:

```text
uads-direct-review-<40-character-commit-sha>
```

The retention target is 90 days. Raw command output is not included in the artifact. Counts are recorded only when a bounded parser proves them; otherwise the value is `null` and a `COUNT_PARSE_UNAVAILABLE:*` reason code is emitted.

## Release contract

The release workflow downloads the artifact for the exact successful CI binding before release validation. The release package includes the exact-CI derivative `github-direct-review-evidence.json`. After publishing, `scripts/github/finalize-direct-review-evidence.mjs` adds GitHub security-workflow, tag, release-run, asset, and identity cross-checks as `github-direct-review-evidence-final.json` with a separate `.sha256` file.

The final derivative cross-checks, when available, are required to agree:

```text
directReview.commitSha
= main branch SHA
= successful CI head SHA
= ci-binding.headSha
= tag target SHA
= release manifest commit
= validation report commit
```

Missing or contradictory identity is `INCOMPLETE` or a validation failure; it is never silently converted into `PASS`. Release notes derive their Review Evidence block from the validated JSON, not from hand-entered counts or SHAs.

## Reviewer path

An independent reviewer can inspect the release assets, `github-direct-review-evidence-final.json`, its checksum, `release-manifest.json`, `SHA256SUMS.txt`, and the pinned GitHub Actions artifact. `npm run review:release -- 0.8.0` also audits the repository state and places the canonical evidence in the external Review ZIP. Historical tag checks are data-driven and compare every known prior tag target; tags are never moved or recreated.
