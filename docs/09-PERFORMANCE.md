# 09 — Performance

## Foundation constraints

- Review generation walks the tree once and skips heavy directories (`node_modules`, `dist`, caches)
- Per-file size cap for ZIP inclusion (1 MB)
- Binary extensions are skipped
- CLI commands are local and synchronous; no network required for `doctor` / `status` / `review`

## Later performance verification

When the orchestrator exists, performance gates apply when a change can affect latency, memory, or token use:

- Token budget adherence is a performance property of the agent loop
- Derived maps must be incremental where possible
- Do not re-scan the full repository on every trivial work order

Prompt 001 does not ship a benchmark harness (`evals/` is reserved).
