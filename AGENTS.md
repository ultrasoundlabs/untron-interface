# Untron Bridge Frontend

This is a Web3 dapp frontend for using Untron protocols. Untron is a cross-chain protocol for swapping between Tron USDT and stablecoins on EVM chains. More details are to come.

## Stack

We use bun as the package manager/CLI, SvelteKit (Svelte v5) as the web framework, shadcn-svelte (and only it!) for UI, vitest for testing, Paraglide for i18n, viem for blockchain interactions, and Wagmi Core for all wallet<>web stuff and whatever you usually need wagmi for. For everything that must be on the server we use SvelteKit's server functions, though the dapp itself is CSR, and we must keep as much logic on the client as feasible, only keeping on server what can't securely be on frontend (e.g. gasless relaying, business logic).

### Bun

TODO: write

### SvelteKit

TODO: write

### Shadcn-svelte

Example from the docs:

```
bun x shadcn-svelte@latest add button
```

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<Button>Click me</Button>
```

Functionality-wise, shadcn-svelte is equivalent to React's shadcn/ui you already know about.

### Vitest

TODO: write

### Paraglide

We maintain English, Spanish, and Russian languages for the entire UI.

### Viem

TODO: write

### Wagmi (via Wagmi Core)

TODO: write

## Specifics of Untron protocols

TODO: write
