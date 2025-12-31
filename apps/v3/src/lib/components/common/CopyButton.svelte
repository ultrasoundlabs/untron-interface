<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';

	type Props = {
		value: string | null | undefined;
		label?: string;
		disabled?: boolean;
	};

	let { value, label = 'Copy', disabled = false }: Props = $props();

	let copied = $state(false);

	async function copy() {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			setTimeout(() => (copied = false), 1200);
		} catch (err) {
			console.error('Copy failed', err);
		}
	}
</script>

<Button
	variant="ghost"
	size="icon-sm"
	onclick={copy}
	disabled={disabled || !value}
	aria-label={label}
	title={label}
	class="h-7 w-7 opacity-60 hover:opacity-100"
>
	{#if copied}
		<CheckIcon />
	{:else}
		<CopyIcon />
	{/if}
</Button>
