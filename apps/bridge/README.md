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

## Deploy notes (static)

This app is built as an SPA (see `src/routes/+layout.ts` with `ssr = false`) using `@sveltejs/adapter-static`.

Deep-link reloads like `/orders/<id>` require your host to serve the SPA fallback (`build/200.html`) for unknown paths.
This repo ships a `static/_redirects` file (emitted to `build/_redirects`) for Netlify / Cloudflare Pages-style routing.

## Before committing

```
bun run format
bun run lint
bun run check
bun run build
```
