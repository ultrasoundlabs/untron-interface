# Untron Bridge Frontend

TODO: write some good stuff about it

To get some basic understanding of the project structure, read [AGENTS.md](./AGENTS.md). If you feel like AGENTS.md is outdated, you're very welcome to update it.

## Quickstart

```
bun i
bun run dev
```

## Backend relayer & env

- **Env vars**: copy `.env.example` to `.env` and fill every `RPC_URL_*`, `BUNDLER_RPC_URL_TEMPLATE`, and `RELAYER_EOA_PRIVATE_KEY`. `getChainRpcUrl`/`getRelayerEoaPrivateKey` throw when something is missing, so you get loud failures during dev.
- **Per-chain mode**: tweak `CHAIN_RELAY_CONFIG` inside [`src/lib/server/config/relayer.ts`](src/lib/server/config/relayer.ts) to flip chains between AA and EOA. When `allowEoaFallback` is true the relayer marks AA unhealthy for ~60s after an infra error and uses EOA meanwhile.
- **Order processing**: Tron→EVM orders complete via [`processConfirmedTronDeposit`](src/lib/server/domain/orders.ts), which turns the confirmed deposit into an ERC-20 `transfer` relayed through `relayEvmTxs`. EVM→Tron now collects an ERC-3009 `transferWithAuthorization` signature and relays it through the same service, falling back between AA/EOA per the chain config.
- **Dev AA testing**: POST to `POST /api/dev/relay-test` (dev mode only) with `{ "chainId": 8453, "to": "0x...", "data": "0x..." }` to fire the relayer manually while you iterate on AA/Gelato wiring.
- **Key management**: AA currently spins up one protocol-owned Safe per chain (single owner = relayer EOA, deterministic `saltNonce: 0n`). Keep that key secure; compromising it compromises all Smart Accounts on the supported chains.

## Before committing

```
bun run format
bun run lint
bun run check
bun run build
```
