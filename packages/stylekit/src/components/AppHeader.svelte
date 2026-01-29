<script lang="ts">
	import { onMount } from 'svelte';
	import UntronLogo from './UntronLogo.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		sticky?: boolean;
		maxWidthClass?: string;
		paddingClass?: string;
		left?: Snippet;
		center?: Snippet;
		right?: Snippet;
	};

	const {
		sticky = true,
		maxWidthClass = 'max-w-7xl',
		paddingClass = 'px-4 py-6',
		left,
		center,
		right
	}: Props = $props();

	let isScrolled = $state(false);

	onMount(() => {
		const update = () => (isScrolled = window.scrollY > 0);
		update();

		window.addEventListener('scroll', update, { passive: true });
		return () => window.removeEventListener('scroll', update);
	});
</script>

<header
	class="{sticky ? 'sticky top-0 z-50' : ''} flex w-full justify-center {paddingClass} transition-[background-color,backdrop-filter,border-color,box-shadow] duration-200 {sticky && isScrolled
		? 'border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60'
		: 'bg-transparent'}"
>
	<div class="flex w-full {maxWidthClass} items-center gap-4">
		<div class="flex items-center gap-3">
			{#if left}
				{@render left?.()}
			{:else}
				<UntronLogo />
			{/if}
		</div>

		<div class="min-w-0 flex-1">
			{#if center}
				{@render center?.()}
			{/if}
		</div>

		<div class="flex items-center justify-end gap-2">
			{#if right}
				{@render right?.()}
			{/if}
		</div>
	</div>
</header>
