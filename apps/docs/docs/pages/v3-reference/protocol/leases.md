---
title: Leases
description: Time-indexed routing rights and fee schedules for receiver salts.
---

A **lease** binds a `receiverSalt` to:
- a fee schedule, and
- a payout route controlled by a **lessee**.

Leases are time-indexed and stored append-only per receiver salt.

## Lease fields (conceptual)

A lease includes:
- `realtor`: allowlisted creator
- `lessee`: controls payout config
- `startTime`: when the lease becomes active
- `nukeableAfter`: earliest time the lease can be replaced
- fee parameters: `leaseFeePpm`, `flatFee`
- accounting: `recognizedRaw`, `backedRaw`, `unbackedRaw`
- `payout`: `{ targetChainId, targetToken, beneficiary }`

## Active lease at time T

The active lease at time `T` is defined as:
- the most recent lease for the receiver salt with `startTime ≤ T`.

This matters because deposits and controller events carry Tron timestamps, and recognition uses the active lease at the relevant time.

## Creating leases

Lease creation is restricted to **realtors** (allowlisted).

Typical constraints enforced by the hub include:
- realtor allowlist membership
- fee floors (protocol + realtor minimums)
- chain deprecation constraints on `targetChainId`
- validity constraints for `startTime` and `nukeableAfter`
- replacement gating: cannot create a new lease for the same salt until the previous lease is nukeable
- optional per-realtor rate limiting

## Updating payout config

The lessee can update the payout route via:
- direct call (`setPayoutConfig`), or
- signature relay (`setPayoutConfigWithSig`, typically EIP-712; supports smart wallets where applicable)

Common checks:
- optional per-lessee rate limiting
- chain not deprecated
- route is “routable”:
  - if a swap is required, a swap rate must be configured for `targetToken`
  - if bridging is required, a bridger must exist for `(targetToken, targetChainId)`

## Fees and net out

Fees are applied when recognition creates a claim:
- protocol + lease fees (ppm) and flat fees determine the net claim amount.
- the difference between recognized raw amount and net out is booked as protocol PnL.

See:
- [Fast-path entitlement](/v3-reference/protocol/entitlement-fast-path)
- [Slow-path controller relay](/v3-reference/protocol/entitlement-slow-path)

