# Risk and gates

Risk is LOW | MEDIUM | HIGH | CRITICAL from structured signals plus **task-relevant** repository context. Ambient auth/contracts in the same repo must not raise an unrelated CSS change.

Gates are selected from the canonical registry, not dumped. Style-only frontend work does not require Web3 fuzzing, dependency-audit, or release-check. DeFi withdrawal requires web3-unit, fuzz, invariant, and security review. Architectural work can select architecture-conformance; package/supply-chain work can select dependency-audit; release-domain work can select release-check.
