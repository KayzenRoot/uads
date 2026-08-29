# agents

Canonical UADS specialist definitions for the current core registry. Copied to `~/.uads/agents/` and optionally to user-level Cursor agents as `uads-*` files.

Host-invokable core roles: repo-inspector, requirements-engineer, software-architect, implementation-planner, implementation-agent, test-engineer, independent-reviewer, security-reviewer, performance-reviewer, checkpoint-manager.

The TypeScript kernel emits routing; hosts/adapters invoke these roles. Do not launch provider APIs from the kernel.
