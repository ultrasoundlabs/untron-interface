---
title: Claims
description: The hub’s obligation objects and FIFO claim queues.
---

A **claim** is an on-chain obligation recorded by the EVM hub.

## Claim model

A claim includes:
- `claimId`: monotonic per lease
- `leaseId`: origin lease
- `amountUsdt`: always denominated in hub USDT
- `targetChainId`: where the payout is intended to be delivered
- `beneficiary`: who receives the payout
- `targetToken`: implicit by the queue the claim is stored in (or stored explicitly depending on implementation)

## Why USDT-denominated claims

All claims store `amountUsdt` so that:
- recognition accounting is independent of swap execution and swap routes,
- swaps can be batched once per `targetToken`,
- the protocol can change swap execution details without touching recognition state.

## Claim queues

Claims are stored in FIFO queues keyed by `targetToken`:

- `claimsByTargetToken[targetToken]`: append-only array
- `nextIndexByTargetToken[targetToken]`: head cursor

When a claim is filled:
- its slot is deleted (not shifted),
- a locator (mapping from `(leaseId, claimId)` to queue position) is cleared.

This structure supports efficient batch settlement (swap once → settle many).

## Lifecycle

1. Recognition enqueues a claim (fast path or slow path).
2. Settlement consumes claims in order via `fill`.
3. Filled claims are deleted and no longer considered outstanding.

See: [Settlement](/v3-reference/protocol/settlement-fill).

