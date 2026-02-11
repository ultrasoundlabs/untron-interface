---
title: Settlement (fill)
description: Permissionless claim settlement, batch swaps, and bridging.
---

Settlement is permissionless: anyone can settle claims via `fill(...)`.

Claims are filled in FIFO order per `targetToken`.

## Entry point

`fill(targetToken, maxClaims, calls)` settles up to `maxClaims` claims from the queue keyed by `targetToken`.

## High-level algorithm

1. **Plan a batch**
   - start from the queue head (`nextIndexByTargetToken[targetToken]`)
   - select up to `maxClaims`, stopping when available hub USDT balance is exhausted
   - compute:
     - `totalUsdt` required to cover the batch (sum of `amountUsdt`)
     - `expectedOutTotal` if swapping is required (sum converted using configured rate)

2. **Swap once (if needed)**
   - if `targetToken != usdt`, execute the swap via a per-hub `SwapExecutor`
   - enforce a minimum output (≥ `expectedOutTotal`)
   - return all output to the hub
   - any surplus output above `expectedOutTotal` is typically paid to `msg.sender` (filler incentive), depending on deployment rules

3. **Settle claims sequentially**
   For each claim in the batch:
   - delete claim slot + locator before external interactions
   - compute payout amount:
     - if `targetToken == usdt`: `outAmount = amountUsdt`
     - else: `outAmount = amountUsdt * ratePpm / 1e6`
   - deliver:
     - if `targetChainId != block.chainid`: call a configured bridger
     - else: transfer directly to beneficiary

## Swap executor

The hub delegates swap execution to a `SwapExecutor`:
- fillers provide the call sequence (DEX route, aggregators, etc.),
- the hub enforces minimum output for safety.

See: [EVM hub contracts](/v3-reference/protocol/contracts-evm).

## Bridgers

When a claim’s `targetChainId` differs from the hub chain, the hub calls a configured bridger adapter:
- the hub transfers tokens to the bridger
- the bridger executes the cross-chain delivery

The hub does not verify destination delivery; bridgers are trusted configuration.

See: [Admin & trust model](/v3-reference/protocol/admin-trust-model).

