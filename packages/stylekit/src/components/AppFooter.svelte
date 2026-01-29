<script lang="ts">
	import type { Snippet } from 'svelte';

	const currentYear = new Date().getFullYear();

	type Props = {
		meta?: Snippet;
		children?: Snippet;
	};

	const { meta, children }: Props = $props();
</script>

<footer class="mt-16 border-t border-border/60 py-10 text-sm text-muted-foreground">
	<div class="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4">
		<div class="flex flex-wrap items-center gap-2">
			<span>© {currentYear} Untron</span>
			{#if meta}
				{@render meta?.()}
			{/if}
		</div>
		{@render children?.()}
	</div>
</footer>
