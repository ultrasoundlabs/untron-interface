---
title: Entitlement recognition (LP-sponsored)
description: Optional subjective acceleration via subjectivePreEntitle.
---

Some deployments support an optional acceleration path where an LP can front liquidity without providing a Tron proof.

## Entry point

`subjectivePreEntitle(txId, leaseId, rawAmount)` creates a claim immediately, funded by the sponsor LP’s principal.

## Behavior

When called:

- no Tron proof is verified,
- sponsor LP’s `lpPrincipal` is debited by the net payout amount,
- a normal claim is enqueued for the beneficiary,
- a subjective record is stored keyed by `txId`.

Later, if a real proof arrives through `preEntitle`:

- if `(leaseId, rawAmount)` matches the subjective record:
  - sponsor principal is reimbursed by the same net amount, and
  - the proof path does **not** create a second claim for the same beneficiary amount.
- otherwise:
  - the subjective record is cleared,
  - sponsor is not reimbursed.

## Risk model

This mechanism isolates credit risk to the sponsor:
- if the deposit was invalid or misattributed, the sponsor bears the loss,
- the protocol does not socialize risk and does not run a risk engine.

This path is optional; the proof-based fast path remains the canonical “provable” recognition mechanism.

See:
- [Fast-path entitlement](/v3-reference/protocol/entitlement-fast-path)
- [LP vault](/v3-reference/protocol/liquidity-lp-vault)

