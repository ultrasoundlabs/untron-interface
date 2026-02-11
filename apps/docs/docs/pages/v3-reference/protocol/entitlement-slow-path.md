---
title: Entitlement recognition (slow path)
description: Relaying and processing the Tron controller event hash-chain.
---

The slow path imports Tron controller activity into the hub without proving Tron logs/state roots.

It is composed of:
1) a Tron-side event hash-chain commitment, and
2) an EVM-side relay + processing pipeline.

## Tron: controller event hash-chain

The Tron controller appends key events into an on-chain SHA-256 hash chain with:
- `eventSeq` (monotonic sequence), and
- `eventChainTip` (rolling commitment)

A helper predicate is exposed:

- `isEventChainTip(bytes32 tip)` reverts unless `tip == eventChainTip`.

Because the EVM side proves Tron **transactions**, a successful call to `isEventChainTip(tip)` becomes a “witnessable” statement about controller state at a particular Tron block.

## EVM: relay controller event chain tip

`relayControllerEventChain(...)` typically:

1. Proves a Tron transaction (via `tronReader`).
2. Ensures the transaction targets the Tron controller.
3. Decodes an asserted tip (`tipNew`) from the call data (direct call or multicall wrapper).
4. Requires progress (`tipNew != lastControllerEventTip`).
5. Recomputes the hash chain locally across the provided events, starting from the last known tip/seq.
6. Requires the recomputed final tip equals `tipNew`.
7. Commits `(tipNew, seq)` and enqueues the provided events for processing.

Important: the hub does **not** independently prove each event was emitted as a Tron log. Instead it relies on:
- the collision resistance of the controller’s hash chain, plus
- the proven correctness of the tip assertion transaction.

## EVM: process relayed controller events

`processControllerEvents(...)` consumes relayed events sequentially.

Unknown event signatures are ignored (cursor advances), so relayers cannot permanently block processing by inserting unrecognized events.

Recognized events generally include:

### Pulled-from-receiver events

`PulledFromReceiver(receiverSalt, token, tokenAmount, exchangeRate, usdtAmount)`:

- updates `lastReceiverPullTimestampByToken[receiverSalt][token]`
- if `token == tronUsdt`:
  - treats `usdtAmount` as backing for previously recognized-but-unbacked volume:
    - walk leases for the receiver salt (oldest-first up to the event timestamp),
    - decrease `unbackedRaw` and increase `backedRaw` until exhausted
- remaining value (or non-USDT cases) may be treated as newly recognized volume at the event timestamp:
  - attributed to the active lease at that time if present; otherwise booked to `protocolPnl`
  - fees applied and claims enqueued as appropriate

### Protocol-level adjustments

Events such as:
- `UsdtSet(address)` (update canonical Tron USDT contract address going forward)
- `UsdtRebalanced(inAmount, outAmount, rebalancer)` (adjust protocol PnL by drift)
- `ControllerUsdtTransfer(recipient, amount)` (treat controller spending as protocol cost)

## Why slow path matters

Even if fast path is used for user UX, slow path is needed for:
- eventual reconciliation (backing updates),
- recognizing value that was not pre-entitled before a pull,
- importing controller-level PnL-relevant information into the hub.

See:
- [Fast-path entitlement](/v3-reference/protocol/entitlement-fast-path)
- [Claims](/v3-reference/protocol/claims)

