rm -rf node_modules .svelte-kit .vite bun.lockb package-lock.json pnpm-lock.yaml yarn.lock
rm -rf apps/landing/node_modules apps/landing/.astro apps/landing/dist
rm -rf apps/bridge/node_modules apps/bridge/.svelte-kit apps/bridge/.vite apps/bridge/bun.lockb apps/bridge/package-lock.json apps/bridge/pnpm-lock.yaml apps/bridge/yarn.lock apps/bridge/dist apps/bridge/node_modules
bun i
