# Context

Radii: C0 metadata/checkpoint, C1 named files, C2 module+tests, C3 neighborhood, C4 subsystems, C5 repository-wide.

CRITICAL or architectural work is C4. HIGH or cross-cutting is C3. C5 is exceptional. Candidate lists must follow the radius; do not append every repository module to a C1 plan. Prefer repository map, checkpoint, and prior decisions before rereading source.

If implementation proves the planned radius insufficient, expand one step with `uads context expand --reason ...`. Never jump C1→C5. C5 remains exceptional (`--approve-c5`). Expansion does not widen product scope.
