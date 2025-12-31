<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';

	type Props = {
		label?: string;
		value: string | null | undefined;
	};

	let { label, value }: Props = $props();

	let copied = $state(false);

	async function copy() {
		if (!value) return;
		await navigator.clipboard.writeText(value);
		copied = true;
		setTimeout(() => (copied = false), 1200);
	}
</script>

<div class="space-y-1">
	{#if label}
		<div class="text-xs font-medium text-muted-foreground">{label}</div>
	{/if}

	<div class="flex items-center gap-2">
		<code class="flex-1 truncate rounded-md border bg-muted/30 px-2 py-1 font-mono text-xs">
			{value ?? '—'}
		</code>
		<Button size="icon-sm" variant="ghost" onclick={copy} disabled={!value} aria-label="Copy">
			{#if copied}
				<CheckIcon />
			{:else}
				<CopyIcon />
			{/if}
		</Button>
	</div>
</div>
