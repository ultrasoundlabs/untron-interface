# Untron V3 Frontend

Static SvelteKit app (SPA-style) for the next iteration of the Untron protocol.

## Commands

```bash
bun install

cd apps/v3
cp .env.example .env
bun dev
bun run build
bun run preview
```

## Env

- `PUBLIC_UNTRON_API_URL` (required): Untron V3 API base URL (OpenAPI; serves realtor endpoints and PostgREST indexer endpoints).
- `PUBLIC_UNTRON_HUB_CHAIN_ID` (required for signing): Hub EVM `chainId` used in the EIP-712 domain when signing payout config updates.
