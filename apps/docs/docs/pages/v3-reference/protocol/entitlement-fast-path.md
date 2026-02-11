---
title: Entitlement recognition (fast path)
description: Proving individual Tron deposits via preEntitle and minting claims.
---

The fast path recognizes value per Tron deposit transaction.

## Entry point

`preEntitle(...)` proves a Tron TRC-20 USDT transfer into a deterministic receiver address and, if valid, recognizes volume and enqueues a claim.

## What it does

Given a valid proof, `preEntitle` typically:

- marks the deposit tx as processed (replay protection),
- attributes the deposit to the active lease at the Tron timestamp,
- updates lease accounting:
  - increases `recognizedRaw`,
  - increases `unbackedRaw` (until later reconciled via pulls),
- books fees into `protocolPnl`,
- enqueues a claim for the net payout amount (if net > 0), using the lease’s current payout config.

## Proof requirements (high level)

`preEntitle` relies on the configured `tronReader` to:
- verify inclusion/finality of a Tron transaction, and
- decode it into a canonical “TriggerSmartContract” view (to, calldata, timestamps, txId, etc.).

The hub then enforces:
- token contract called must equal configured Tron USDT (`tronUsdt`)
- calldata matches `transfer` or `transferFrom`
- recipient equals the derived receiver address for `(controller, receiverSalt)`
- replay protection via `depositProcessed[txId]`

## Ordering constraint vs pulls

To avoid double counting deposits already covered by a processed receiver pull event, the hub enforces:

- `depositTimestamp > lastReceiverPullTimestampByToken[receiverSalt][tronUsdt]`

This prevents recognizing deposits that occurred at/before a pull timestamp that has already been processed via the slow path.

## Claim denomination

Claims created by the fast path store `amountUsdt` even if the lease is configured to pay in another token. Conversion happens at fill time.

See:
- [Claims](/v3-reference/protocol/claims)
- [Settlement](/v3-reference/protocol/settlement-fill)
- [Admin & trust model](/v3-reference/protocol/admin-trust-model) (tronReader trust boundary)

