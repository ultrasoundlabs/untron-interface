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

- `PUBLIC_UNTRON_API_URL` (required): Untron V3 backend base URL (serves `/protocol`, `/sql/db`, REST endpoints).
