# Execution

Host loop after a valid plan:

```
uads dispatch
-> selected implementation specialist(s)
-> NECESSARY in-scope edits only
-> uads verify
-> host runs selected gates and records evidence
-> uads assurance start
-> distinct reviewer session(s)
-> uads assurance record
-> on CORRECTION_NEEDED: implement, re-verify, new digest
-> uads finalize
-> uads review when a ZIP is required
```

`uads dispatch --session <id>` binds the authoritative implementer session before implementation/review. Redispatch with a different session is rejected. `uads assurance record` requires review phase after `uads assurance start`; `--implementer-session` may only corroborate the bound run identity.

Command PASS evidence requires `kind=command`, command text, exit 0, and a captured output digest. Review gates are satisfied only by the mapped reviewer record. Current-digest FAIL/BLOCKED stays blocking until `uads verify` produces a new digest. Change digest hashes actual file bytes (including untracked binaries) using NUL-delimited Git porcelain. Corrupt evidence/review JSON fails closed.

If isolated reviewer context is unavailable, do not fake approval; record BLOCKED. The implementation agent must not self-approve.

Context expansion is one radius step (`uads context expand --reason ...`). C5 stays exceptional (`--approve-c5`). Expansion is not permission to edit unrelated areas.
