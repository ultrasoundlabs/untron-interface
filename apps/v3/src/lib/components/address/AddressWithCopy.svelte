<script lang="ts">
	import CopyButton from '$lib/components/common/CopyButton.svelte';

	type Props = {
		label?: string;
		value: string | null | undefined;
	};

	let { label, value }: Props = $props();
</script>

<div class="space-y-1">
	{#if label}
		<div class="text-xs font-medium text-muted-foreground">{label}</div>
	{/if}

	<div class="flex items-center gap-2">
		<code class="flex-1 truncate rounded-md border bg-muted/30 px-2 py-1 font-sans text-xs">
			{value ?? '—'}
		</code>
		<CopyButton {value} label={`Copy ${label ?? 'value'}`} />
	</div>
</div>
