<script lang="ts">
	import { cn } from '$lib/utils';
	import CopyButton from '$lib/components/common/CopyButton.svelte';

	type Props = {
		value: string | number | bigint | null | undefined;
		copyValue?: string | null;
		display?: string | null;
		label?: string;
		class?: string;
	};

	let {
		value,
		copyValue = null,
		display = null,
		label = 'Copy value',
		class: className
	}: Props = $props();

	function asString(v: string | number | bigint | null | undefined): string | null {
		if (v === null || v === undefined) return null;
		if (typeof v === 'string') return v;
		if (typeof v === 'number') return String(v);
		return v.toString(10);
	}

	const raw = $derived(asString(value));
	const shown = $derived(display ?? raw);
	const toCopy = $derived(copyValue ?? raw);
</script>

<span class={cn('inline-flex min-w-0 items-center gap-1', className)}>
	<span class="min-w-0 truncate">{shown ?? '—'}</span>
	<CopyButton value={toCopy} {label} disabled={!toCopy} />
</span>
