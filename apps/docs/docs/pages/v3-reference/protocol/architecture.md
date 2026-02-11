---
title: System architecture
description: Two-lane architecture and on-chain responsibilities.
---

Untron V3 splits responsibilities across two chains.

## Lanes

### Tron lane (source / collection)

Purpose: accept simple TRC-20 transfers (typically USDT) into deterministic receiver addresses and compress controller activity into a commitment.

Key properties:
- Receiver addresses are deterministic and can be deployed late.
- A controller can sweep receivers permissionlessly.
- Controller actions are committed into an on-chain SHA-256 event hash-chain.

See: [Tron contracts](/v3-reference/protocol/contracts-tron).

### EVM lane (settlement / hub)

Purpose: maintain routing rights over time, recognize deposits and controller activity, create claims, and settle claims.

Key properties:
- Routing is managed via time-indexed **leases**.
- Value recognition happens via:
  - **Fast path:** prove individual Tron deposits (`preEntitle`)
  - **Slow path:** relay and process controller event hash-chain (`relayControllerEventChain`, `processControllerEvents`)
- Claims are settled permissionlessly (`fill`) using hub liquidity; settlement may include swapping and/or bridging.

See: [EVM hub contracts](/v3-reference/protocol/contracts-evm).

## Roles (high level)

- **Depositors (Tron):** send TRC-20 tokens to receiver addresses.
- **Permissionless relayers:** can trigger sweeps/rebalances on Tron, prove deposits on EVM, relay/consume controller events, and fill claims.
- **Realtors (allowlisted):** create leases for receiver salts on the hub.
- **Lessees:** control payout routing for a lease.
- **LPs (allowlisted):** provide hub USDT liquidity; may optionally sponsor subjective pre-entitlements.
- **Owner/Admin (privileged):** configures proof reader, allowlists, swap rates, bridgers, and other protocol parameters.

For more detail, see: [Admin & trust model](/v3-reference/protocol/admin-trust-model).

## Why claims are USDT-denominated

Claims store `amountUsdt` even if ultimately paid in another token. Settlement-time conversion enables:
- deterministic accounting at recognition time,
- batch swapping once per target token,
- swapping/route flexibility without re-writing recognition state.

See: [Claims](/v3-reference/protocol/claims) and [Settlement](/v3-reference/protocol/settlement-fill).

