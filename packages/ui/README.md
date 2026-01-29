# `@untron/ui`

Shared shadcn-svelte component library used by all Untron SvelteKit apps.

## Usage

Import components from the package, not from app-local copies:

```svelte
<script lang="ts">
	import { Button } from '@untron/ui/button';
	import * as Table from '@untron/ui/table';
</script>
```

## Adding components

Use shadcn-svelte to add a component, then keep it in `packages/ui` so all apps share it:

```bash
bun x shadcn-svelte@latest add button
```

## Design rules

- shadcn-svelte only (no second UI kit).
- Flat visuals: borders/backgrounds over shadows.
- Keep typography Inter (no `font-mono`; use `tabular-nums` for numeric alignment).

