---
title: Liquidity (LP vault)
description: Principal-only liquidity buffer used to fast-fill claims.
---

The LP vault is a principal-only liquidity buffer (no yield accounting) used by the hub to fast-fill claims.

## Deposit

Allowlisted LPs can deposit hub USDT:
- USDT is transferred into the hub
- `lpPrincipal[lp]` increases by the deposit amount

## Withdraw

Any LP (even if later delisted) can withdraw:
- amount must be ≤ `lpPrincipal[lp]`
- amount must be ≤ actual hub USDT balance
- principal is decreased and USDT transferred out

## Notes

- There is no interest math and no yield strategy in the vault.
- Optional acceleration (`subjectivePreEntitle`) debits LP principal to front a claim.

See:
- [LP-sponsored recognition](/v3-reference/protocol/entitlement-subjective)
- [Settlement](/v3-reference/protocol/settlement-fill)

