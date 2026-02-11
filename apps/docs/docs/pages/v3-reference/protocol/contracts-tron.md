---
title: Tron lane contracts
description: Receiver, controller, controller index, rebalancers, and token semantics.
---

This page summarizes the on-chain responsibilities of the Tron lane.

## UntronReceiver (deterministic receiver)

Responsibilities:
- hold TRC-20 tokens and TRX
- allow the controller (and only the controller) to pull tokens out

Key behavior:
- deployed via deterministic CREATE2 address derivation
- can be deployed “late” (after deposits arrive)

Common entry point:
- `pull(token, amount)` — controller-only transfer to controller

See also: [Deterministic receivers](/v3-reference/protocol/deterministic-receivers).

## UntronController (sweeping, rebalancing, accounting)

Responsibilities:
- compute/predict receiver addresses for salts
- deploy receivers if missing
- sweep balances from receivers into the controller (permissionless)
- enforce accounting invariants around canonical USDT reserves (`pulledUsdt`)
- support rebalancing via delegatecall rebalancers

Key behaviors:
- `pullFromReceivers(token, receiverSalts)` is permissionless
- sweep amount is typically `balanceOf(receiver) - 1` (leaves 1 base unit)
- rebalancing is permissionless but uses owner-configured payloads

## UntronControllerIndex (controller event hash-chain)

Responsibilities:
- append key controller events into a SHA-256 event hash-chain
- expose a predicate `isEventChainTip(tip)` that reverts unless `tip` matches the current chain tip

Why it exists:
- the EVM hub proves Tron transactions, not Tron state roots
- a successful `isEventChainTip(tip)` call can be proven, and acts as a witness of a specific controller tip at a specific Tron block

See: [Slow-path controller relay](/v3-reference/protocol/entitlement-slow-path).

## Rebalancers (delegatecall modules)

Responsibilities:
- implement bridge-/rebalance-specific logic executed by the controller via delegatecall
- produce an out amount used for analytics and later EVM-side reconciliation (via relayed events)

## Tron token semantics

Tron-side token utility code treats TRC-20 calls as failed only on revert, to tolerate non-standard tokens that may return `false` even on success.

Protocol constraint:
- supported tokens must revert on failure for correct behavior.

