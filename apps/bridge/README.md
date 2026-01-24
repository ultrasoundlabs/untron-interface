# Untron Bridge Frontend

TODO: write some good stuff about it

To get some basic understanding of the project structure, read [AGENTS.md](./AGENTS.md). If you feel like AGENTS.md is outdated, you're very welcome to update it.


## Quickstart

```
bun i
bun run dev
```

## Environment

- `PUBLIC_UNTRON_BRIDGE_API_URL` (optional): Bridge API base URL (defaults to production from `openapi.json`).
- `PUBLIC_TURNSTILE_SITE_KEY` (required for orders): Cloudflare Turnstile site key used to obtain the `cf-turnstile-response` token for `POST /v1/orders`.

## Static build

This app is intentionally frontend-only (no SvelteKit server routes, workflows, or relayer code). It talks directly to the Untron Bridge API.

## Before committing

```
bun run format
bun run lint
bun run check
bun run build
```
