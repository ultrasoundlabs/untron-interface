# Untron Interface (Monorepo)

This repo contains all Untron frontends and shared UI tooling.

## Repo Layout

- `apps/bridge`: SvelteKit (Svelte v5) bridge dapp UI (i18n via Paraglide).
- `apps/v3`: SvelteKit (Svelte v5) “V3 dashboard / explorer” UI.
- `apps/landing`: Astro landing site.
- `packages/stylekit`: shared design tokens + layout primitives (header/footer/theme/head).
- `packages/ui`: shared shadcn-svelte component library (the only UI primitives we use).
- `packages/connectkit`: shared wallet connection primitives (wagmi + wallet metadata/icons).

## Stack + Defaults

- Package manager / scripts: `bun`.
- UI framework: SvelteKit (Svelte v5).
- UI components: **shadcn-svelte only** (via `@untron/ui/*`). Never introduce a second UI kit.
- Styling: Tailwind v4 + `tw-animate-css`.
- Testing: Vitest (per-app).
- i18n: Paraglide (bridge app).
- Web3: viem + Wagmi Core.

## Deploy (Cloudflare Pages)

- Cloudflare Pages currently runs `npm install` in the app directory even if the build command uses `bun`.
- npm sometimes drops native optional deps; to keep deploys stable we pin platform bindings in each app `package.json` under `optionalDependencies` (Rollup / LightningCSS / Tailwind Oxide).

## Design System Rules (high priority)

### One font only

- We use **Inter** everywhere.
- Avoid `font-mono`. For “code-like” strings (addresses, hashes), use `tabular-nums` + truncation instead.
- `code/pre/kbd/samp` should inherit the app font (handled by stylekit theme).

### Flat > shadowy

Our “separation” style is:

- Prefer **thin borders**, background tints, and spacing.
- Avoid `shadow-*` defaults across components (kept flat in `@untron/ui`).

### Tables

Tables should read cleanly under density:

- Use `tabular-nums` for numeric columns.
- Prefer subtle zebra + hover + borders (handled by `@untron/ui/table`).
- Use typographic hierarchy inside cells (primary `text-sm font-medium`, secondary `text-xs text-muted-foreground`).

### Header

- Use `@untron/stylekit/components/AppHeader.svelte` for consistent layout.
- Sticky header becomes “frosted” on scroll (blur + border, no shadow).
- Product nav is `@untron/stylekit/components/ProductNav.svelte` (`Bridge · V3 · Integrate`).
  - Links are driven by public env vars: `PUBLIC_BRIDGE_URL`, `PUBLIC_V3_URL`, `PUBLIC_DOCS_URL` (disabled if missing).

### Theme

- Theme tokens live in `@untron/stylekit/theme.css` and are imported by each app’s `src/routes/layout.css`.
- Theme preference is stored in `localStorage` key `theme` (`light` | `dark` | `system`).
- Avoid theme flash: apps set theme early in `src/app.html`.
- `ThemePicker` is intentionally a **light/dark toggle** (bridge-style UX).

### Tailwind v4 content scanning

When you add new shared components in `packages/*`, ensure each SvelteKit app’s `src/routes/layout.css` includes `@source` globs for workspace packages so Tailwind picks up classes.

## Svelte v5 Conventions

- Prefer runes (`$state`, `$derived`, `$effect`) over legacy `$:` reactive statements in runes-mode components.
- For component composition, prefer snippet props + `{@render ...}` over `<slot>`.

## State Management

For non-trivial flows (swap, step-based processes, etc.):

- Prefer “store objects” built with Svelte 5 runes over classic `writable`.
- Keep all mutable state inside a `createXStore()` factory.
- Use `$derived`/`$derived.by` for computed state.
- Expose a plain object API and pass via Svelte context when needed.

## UX / Product Principles

### Users are idiots (seriously)

Assume users are non-technical; crypto newbies even more so.

- Don’t use jargon in UI copy unless it’s unavoidable.
- Prefer “what do I do next?” flows over configuration.
- Be explicit about status, loading, and error states.

### Animations

We like animations everywhere, but they must serve UX:

- Explain spatial change (where did it go/come from?)
- Show cause & effect (you clicked → this changed)
- Guide attention (look here now)
- Reveal system status (loading, success, error)

Keep motion consistent across the product and respect `prefers-reduced-motion`.

**“Just tell me what numbers to use” cheatsheet**

- Micro-interactions (hover, small feedback): 120–200ms
- Standard UI transitions (modals, dropdowns, small panels): 200–300ms
- Big layout changes (page transitions, large panels sliding): 300–450ms (rarely above 500ms)
- Subtle “alive” animations (pulses, shimmer): 800–1200ms with very low amplitude

Easing:

- Entering / focusing attention: ease-out / decelerate
- Leaving: ease-in / accelerate
- Physical motion: spring-ish, tiny/no overshoot

Performance:

- Prefer animating `transform` + `opacity` (aim for 60fps).
- Avoid animating layout properties (top/left/width/height) unless you have to.

## Shared Packages (how to use them)

### `@untron/stylekit`

- Theme: `@untron/stylekit/theme.css`
- Fonts/head: `@untron/stylekit/head/inter.svelte`
- Layout: `AppHeader`, `UntronFooter`, `UntronLogo`, `ProductNav`, `ThemePicker`
- Wallet UI: `@untron/stylekit/components/WalletStatus.svelte` (apps pass connection + actions + strings)

### `@untron/ui`

- Shared shadcn-svelte primitives (Button/Card/Dialog/Table/etc.).
- If you need a new shadcn component, add it here and consume from apps as `@untron/ui/<component>`.
- Keep components “flat”: borders/background over shadows.

## shadcn-svelte Rules (must-follow)

We treat shadcn-svelte as our “standard library” for UI.

- **Do not re-implement** common UI primitives (buttons, dropdowns, dialogs, inputs, selects, tables, tabs, etc.) if they can be built from existing shadcn components.
- Assume the shadcn-svelte catalog covers basically everything you’d reach for in “vanilla Svelte components”; start by checking/using `@untron/ui` first.
- If a shadcn component is missing, add it to `packages/ui` and then import it from apps as `@untron/ui/<component>`.

### Adding components

From an app directory (or repo root if your setup supports it), use:

`bun x shadcn-svelte@latest add button`

Then move/keep the generated component in `packages/ui` so all apps share it.

### `@untron/connectkit`

- Wallet metadata + icons: `@untron/connectkit/wallets` (`WALLETS` icons are bundled; apps should not rely on `static/logos/wallets/*`).
- Wagmi helpers: `@untron/connectkit/wagmi`
  - `createInjectedWagmiConfig(chains)`
  - `createConnectionStore(config)`
  - `connectInjectedWallet(config)`, `disconnectWallet(config)`
- WalletConnect support will live here when added.

## Frontend Architecture Notes

- Prefer CSR for dapps; keep as much logic client-side as feasible.
- Use SvelteKit server routes/actions only for things that cannot be safely done in the browser (gasless relaying, sensitive business logic, etc.).
- TronWeb should only be used server-side when it needs secrets (signers/relayers).

## Commands

- Bridge: `bun run dev`, `bun run check` (from repo root scripts)
- V3: `bun run dev:v3`, `bun run check:v3`
