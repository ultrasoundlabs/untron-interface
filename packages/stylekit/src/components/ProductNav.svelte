<script lang="ts">
	type NavItem = {
		id: string;
		label: string;
		href?: string;
		external?: boolean;
		disabled?: boolean;
	};

	type Props = {
		items: ReadonlyArray<NavItem>;
		activeId?: string;
	};

	const { items, activeId }: Props = $props();

	function isDisabled(item: NavItem) {
		return item.disabled || !item.href || item.href === '#';
	}
</script>

<nav class="flex items-center text-base">
	{#each items as item, i (item.id)}
		{#if i !== 0}
			<span class="px-1.5 text-muted-foreground/60">·</span>
		{/if}

		<a
			href={isDisabled(item) ? undefined : item.href}
			target={item.external ? '_blank' : undefined}
			rel={item.external ? 'noreferrer noopener' : undefined}
			aria-current={activeId === item.id ? 'page' : undefined}
			class="rounded-lg px-2.5 py-1.5 transition-colors {activeId === item.id
				? 'text-foreground font-semibold'
				: isDisabled(item)
					? 'cursor-not-allowed text-muted-foreground/50'
					: 'text-muted-foreground hover:bg-muted/25 hover:text-foreground'}"
			onclick={(e) => {
				if (isDisabled(item)) e.preventDefault();
			}}
		>
			{item.label}
		</a>
	{/each}
</nav>
