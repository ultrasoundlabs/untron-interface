rm -rf node_modules .svelte-kit .vite bun.lockb package-lock.json pnpm-lock.yaml yarn.lock
rm -rf apps/landing/node_modules apps/landing/.astro apps/landing/dist
rm -rf apps/bridge/node_modules apps/bridge/.svelte-kit apps/bridge/.vite apps/bridge/bun.lockb apps/bridge/package-lock.json apps/bridge/pnpm-lock.yaml apps/bridge/yarn.lock apps/bridge/dist apps/bridge/node_modules
rm -rf apps/v3/node_modules apps/v3/.svelte-kit apps/v3/.vite apps/v3/bun.lockb apps/v3/package-lock.json apps/v3/pnpm-lock.yaml apps/v3/yarn.lock apps/v3/dist apps/v3/node_modules
bun i
