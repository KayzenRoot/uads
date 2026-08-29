# Orchestration protocol

The host LLM interprets the user request. The TypeScript kernel is deterministic.

```
USER REQUEST -> SKILL / HOST LLM -> NORMALIZED INTAKE -> KERNEL -> WORK ORDER + ROUTING + CHECKPOINT
```

Do not re-scan the whole repository to resume. Use `uads resume`.
Do not expand scope during planning without recording the expansion.
Prompt 002 plans through the `plan` phase. Prompt 003 continues:

```
PLAN -> DISPATCH -> IMPLEMENT -> VERIFY -> INDEPENDENT REVIEW -> COMPLETE
```

`uads review` generates the review ZIP. Assurance uses `uads assurance start` / `uads assurance record`.

