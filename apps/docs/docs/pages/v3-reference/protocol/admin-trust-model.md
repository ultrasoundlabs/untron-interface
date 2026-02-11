---
title: Administration and trust model
description: Privileged configuration surface and explicit trust boundaries.
---

Untron V3 is not “trustless everywhere.” Instead, the protocol aims for explicit, minimal trust boundaries.

## Owner/admin configuration (EVM hub)

The hub owner/admin typically can configure:

- hub accounting token (`usdt`)
- Tron canonical USDT address (`tronUsdt`) (directly or via processing controller events, depending on deployment)
- Tron proof reader (`tronReader`)
- allowlists (realtors, LPs)
- swap rates (`swapRatePpm[targetToken]`)
- bridger registry entries (per token and destination chain)
- chain deprecations (prevent new payout configs targeting deprecated chains)
- pausing/unpausing
- protocol profit withdrawal (bounded by `protocolPnl`)
- token rescue (non-accounting tokens)

Because these controls affect recognition and settlement, the owner is a highly privileged role.

## Explicit trust boundaries

### tronReader (Tron proof system)

The hub’s “provable truth about Tron” is mediated by `tronReader`.
- A correct reader enforces that only real Tron transactions are accepted.
- A malicious reader could fabricate proofs.

### Bridgers (delivery)

Bridgers are adapter contracts responsible for delivery to other chains.
- The hub does not verify destination delivery.
- Correctness depends on the bridger implementation and configuration.

### Fillers (swap routes)

Fillers choose swap routes and call sequences.
Safety is enforced via minimum-output checks and by settling only what the hub can cover.

## Safety notes (non-exhaustive)

- **At-most-once recognition:** Fast path uses `depositProcessed[txId]` replay protection plus an ordering constraint relative to processed pull timestamps.
- **Reentrancy hygiene:** Claim slots and locators are deleted before external calls during settlement.
- **Time coherence:** Lease activation uses EVM timestamps; deposit attribution uses Tron timestamps. The protocol assumes both are reasonable Unix seconds.

See:
- [Fast-path entitlement](/v3-reference/protocol/entitlement-fast-path)
- [Slow-path controller relay](/v3-reference/protocol/entitlement-slow-path)
- [Settlement](/v3-reference/protocol/settlement-fill)

