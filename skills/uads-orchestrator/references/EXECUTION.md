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

`uads review` still means review ZIP generation. Assurance uses `uads assurance start` / `uads assurance record`.

If isolated reviewer context is unavailable, do not fake approval; record BLOCKED. The implementation agent must not self-approve.

Context expansion is one radius step (`uads context expand --reason ...`). C5 stays exceptional (`--approve-c5`). Expansion is not permission to edit unrelated areas.
