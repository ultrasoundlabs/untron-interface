---
title: EVM hub contracts
description: Hub, facets, index, proof reader, swap executor, and bridgers.
---

This page summarizes the on-chain responsibilities of the EVM settlement hub lane.

## UntronV3 hub: shared state + facet entrypoints

The hub is a single deployed contract that owns all state.

To keep runtime bytecode under size limits, heavy entrypoints live in separate **facet** contracts that are invoked via `delegatecall`.

Important property:
- facet addresses are set as constructor immutables (a “static facet split”), not a governance-upgrade mechanism.

## Hub index (event emission + hub-local hash chain)

The hub’s eventing is typically routed through an index helper:
- events are emitted through internal helpers rather than being emitted directly from the hub logic,
- events may also be appended into a hub-local SHA-256 event hash-chain for integrity/indexing.

## Key facets / entrypoints (conceptual)

- **Admin**: privileged configuration (proof reader, allowlists, swap rates, bridgers, pauses, chain deprecations, etc.)
- **Lease**: create leases; update payout configs
- **Entitle**: `preEntitle` (fast path) and optional `subjectivePreEntitle`
- **Controller**: slow path relay (`relayControllerEventChain`) and processing (`processControllerEvents`)
- **LP vault**: deposit/withdraw principal
- **Fill**: `fill` claim settlement

## Tron proof reader (tronReader)

The hub relies on a configured `tronReader` to:
- verify Tron tx inclusion/finality, and
- decode tx call data and timestamps.

The `tronReader` is a trust boundary because it is configurable by the hub owner.

See: [Admin & trust model](/v3-reference/protocol/admin-trust-model).

## SwapExecutor

Swaps are executed via a per-hub `SwapExecutor`:
- only callable by the hub
- executes a filler-provided call sequence
- enforces a minimum output for a specific token
- returns output to the hub

This isolates swap execution from core accounting.

## Bridgers (adapter interface)

Bridgers implement a simple adapter interface used during `fill`:
- if `targetChainId != block.chainid`, the hub transfers tokens to a bridger and calls it to deliver cross-chain.

The hub does not verify destination delivery; bridgers are trusted configuration.

