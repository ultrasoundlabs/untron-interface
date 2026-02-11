---
title: Deterministic receivers
description: Receiver salts, address derivation, late deployment, and sweeping behavior.
---

Receivers are a shared primitive across both lanes: a receiver is named by a `receiverSalt` (`bytes32`), and that salt deterministically implies a Tron receiver address.

## Receiver salt

- A receiver is identified by `receiverSalt`, not by an address.
- The same salt can be referenced on the EVM hub for leasing, recognition, and reconciliation.

## Address derivation (high level)

The receiver address is derived from:
- Tron controller address
- `receiverSalt`
- receiver creation bytecode hash (receiver implementation embedded)
- a Tron-specific CREATE2 prefix

The hub predicts this address so it can:
- validate deposit recipients during `preEntitle`,
- attribute deposits to a specific receiver salt and its active lease.

## Late deployment

Deposits can arrive at a receiver address **before code exists** at that address.

Later:
- the controller deploys the receiver contract at the deterministic address, and
- pulls accumulated balances into the controller.

This pattern enables “address allocation” without deploying a contract per user up-front.

## Sweeping (“pulling”) from receivers

Sweeping is permissionless on Tron:

- For a given token and list of receiver salts:
  - compute the deterministic receiver address per salt
  - deploy the receiver if not deployed yet
  - pull `balanceOf(receiver) - 1` (leaving 1 base unit)
  - transfer the swept amount into the controller
  - append an event into the controller event hash-chain

The EVM hub later learns about sweeps through the slow-path controller relay.

See:
- [Tron contracts](/v3-reference/protocol/contracts-tron)
- [Slow-path controller relay](/v3-reference/protocol/entitlement-slow-path)

