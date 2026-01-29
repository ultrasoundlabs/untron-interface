# `@untron/stylekit`

Shared design tokens + layout primitives for Untron apps.

## What lives here

- Theme tokens + base styles exported as `@untron/stylekit/theme.css`
- `<svelte:head>` helpers like `@untron/stylekit/head/inter.svelte`
- Layout components like `AppHeader`, `UntronFooter`, `UntronLogo`, `ProductNav`, `ThemePicker`

## Usage

In each SvelteKit app:

- Import the theme in `src/routes/layout.css`:
  - `@import '@untron/stylekit/theme.css';`
- Include the Inter head helper once in your root layout:

```svelte
<script lang="ts">
	import InterHead from '@untron/stylekit/head/inter.svelte';
</script>

<InterHead />
```

