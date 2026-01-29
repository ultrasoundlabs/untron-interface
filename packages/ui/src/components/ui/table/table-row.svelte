<script lang="ts">
	import { cn, type WithElementRef } from '../../../utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn(
		'border-b border-border/60 transition-colors even:bg-muted/10 hover:bg-muted/20 data-[state=selected]:bg-muted/25',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
