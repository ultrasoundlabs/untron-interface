---
title: Terminology
---

This page defines protocol terms used throughout the reference.

## Addressing and routing

- **Receiver salt (`bytes32`)**: Identifier used to deterministically derive a Tron receiver address. Receivers are named by salt, not by address.
- **Receiver address**: Tron address derived from `(controller, receiverSalt)` using Tron-compatible CREATE2 derivation.
- **Late deployment**: Pattern where deposits arrive at a receiver address before code exists there; later the controller deploys the receiver contract at the deterministic address and pulls funds.
- **Payout route / payout config**: `targetChainId`, `targetToken`, and `beneficiary` that determine where and how a claim is settled.

## Accounting and obligations

- **Lease**: Time-indexed record that defines routing rights and fee parameters for a receiver salt (who controls payout config, fee schedule, and replacement conditions).
- **Active lease at time T**: The most recent lease for a receiver salt whose `startTime ≤ T`.
- **Recognized volume**: Amount the hub has attributed to a lease based on proofs and/or controller events.
- **Backed vs unbacked**: Accounting fields used to distinguish recognized volume that has (backed) or has not yet (unbacked) been reconciled against controller pull events.

## Claims and settlement

- **Claim**: An EVM-hub obligation object. Claims are always denominated in hub USDT (`amountUsdt`), even if later paid in another token.
- **Claim queue**: FIFO queue of claims keyed by `targetToken` for efficient batch settlement.
- **Fill / filler**: Permissionless settlement of claims; a filler supplies swap call data (if needed) and triggers transfers/bridging to beneficiaries.

## Cross-chain verification

- **Tron proof reader (`tronReader`)**: EVM-side contract that verifies Tron transactions and decodes them into a canonical form used by the hub.
- **Fast path**: Per-deposit transaction proof (`preEntitle`) that recognizes a Tron USDT transfer and creates a claim without waiting for a sweep.
- **Slow path**: Controller hash-chain relay (`relayControllerEventChain`) + processing (`processControllerEvents`) that reconciles controller activity, backing, and protocol PnL.
- **Controller event hash-chain**: SHA-256 rolling commitment over controller-appended events on Tron, anchored by a tip value (`eventChainTip`).

