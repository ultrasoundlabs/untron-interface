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

## Engineering Style

### State management (Svelte 5 runes)

For feature-level state (like the swap flow), we prefer self-contained \"store objects\" built with Svelte 5 runes instead of classic `writable` stores. See `src/lib/stores/swapStore.svelte.ts` for the pattern:

- keep all mutable state as `$state` locals inside a `createXStore()` factory
- use `$derived` / `$derived.by` for computed values instead of manual subscriptions
- expose a plain object API (getters for state + methods for actions) and pass it via Svelte context when needed

New complex flows should follow this pattern so that business logic lives in one place instead of being scattered across components.

## UI Style

Generally you should favor path-of-least-resistance-to-shadcn-svelte philosophy, and when you do have to design new stuff, rely on how stuff like this is already designed elsewhere in the codebase. There are some details that you have to keep in mind, though:

### Users are idiots

Users are idiots, crypto users are even larger idiots, crypto newbies we primarily target are even larger idiots. Don't use even slightly technical terms in the UI, make the user feel like we're in the same boat, question established practices in crypto (because crypto devs are idiots as well) in favor of solutions that give obviously better user experience.

### Animations

We love to use animations everywhere. You should use Svelte's native animation primitives whenever you create something in the UI. Make sure your (and not just your, but really the entire project's) animations are consistent with each other and best practices of animation.

Example:

```svelte
<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	let open = false;
</script>

<button onclick={() => (open = !open)}> Toggle </button>

{#if open}
	<div in:fly={{ y: 20, duration: 200 }} out:fade>Hello from Svelte ✨</div>
{/if}
```

```svelte
<script lang="ts">
	import { spring } from 'svelte/motion';

	const x = spring(0, { stiffness: 0.1, damping: 0.3 });
	function moveRight() {
		x.set(200); // animates like a spring
	}
</script>

<div style="transform: translateX({$x}px)">I slide with spring physics</div>

<button on:click={moveRight}>Move</button>
```

#### “Just tell me what numbers to use” cheatsheet

Based on Material, NN/g, and various UX motion articles: ￼

Durations (desktop-ish)

- Micro-interactions (hover, small feedback): 120–200 ms
- Standard UI transitions (modals, dropdowns, small panels): 200–300 ms
- Big layout changes (page transitions, large panels sliding): 300–450 ms (rarely above 500 ms)
- Very subtle “alive” animations (pulses, shimmer): often 800–1200 ms but extremely low amplitude so they don’t feel slow.

Easing

- For things entering / focusing attention:
  - Decelerate: fast start, slow end (ease-out, or Material “standard” / “deceleration” curve). ￼
- For things leaving:
  - Accelerate: slow start, fast end (ease-in).
- For motion that feels physical (cards, lists etc.):
  - spring-ish curves, overshoot kept tiny or zero.

Basic rule of thumb

- Smaller distance / change → shorter duration.
- Larger distance / change → longer duration.
  (Carbon explicitly calls this out. )

#### Behavioral rules (the part no one writes down)

Here’s a compact checklist, distilled from HIG, Material, NN/g and recent microinteraction articles: ￼

A. Always answer: what is this animation for?

Every animation should do at least one of:

- Explain spatial change (where did that element go/come from?)
- Show cause & effect (you clicked → this changed)
- Guide attention (look here now)
- Reveal system status (loading, success, error)

If it’s just “because it looks cool” and doesn’t do any of those → kill it.

B. Consistency over cleverness

- Use one motion style per product (or major section): same easing + duration for “similar” transitions (all modals, all dropdowns, etc.). ￼
- Don’t let one animation be bouncy and another dead-linear for the same interaction.

C. Timing rules

- Keep most UI transitions under 300 ms. Over that feels laggy unless it’s a deliberate hero effect. ￼
- Don’t chain a bunch of long things: micro-interactions should feel snappy (≈150–250 ms).
- Staggered animations (lists etc.) are nice, but keep the stagger tiny (40–80 ms).

D. Accessibility & motion reduction

- Respect the user’s “Reduce motion” preference (prefers-reduced-motion):
- Shorten or remove large camera-like movements
- Replace them with simple fades or instant state changes
- Avoid huge parallax / zoomy stuff as the default; HIG and others explicitly warn this can cause discomfort. ￼

E. Don’t hurt performance

- Aim for 60 fps: mainly transform and opacity only. ￼
- Avoid animating layout-affecting properties (top/left/width/height) when you can.

## Specifics of Untron protocols

TODO: write
