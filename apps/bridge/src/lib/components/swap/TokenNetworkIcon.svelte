<script lang="ts">
	interface Props {
		tokenLogoUrl?: string;
		tokenSymbol?: string;
		size?: number;
		className?: string;
	}

	let { tokenLogoUrl, tokenSymbol, size = 28, className = '' }: Props = $props();

	let tokenFailed = $state(false);

	const normalizedTokenLogo = $derived.by(() => {
		if (!tokenLogoUrl) return undefined;
		if (tokenLogoUrl.startsWith('http') || tokenLogoUrl.startsWith('data:')) return tokenLogoUrl;
		return tokenLogoUrl.startsWith('/') ? tokenLogoUrl : `/${tokenLogoUrl}`;
	});

	$effect(() => {
		if (tokenLogoUrl) tokenFailed = false;
		else tokenFailed = false;
	});
</script>

<div
	class={`relative inline-flex items-center justify-center select-none ${className}`}
	style={`width:${size}px;height:${size}px;`}
>
	<div
		class="relative size-full overflow-hidden rounded-full bg-zinc-100 transition-transform duration-150 dark:bg-zinc-700"
	>
		{#if !tokenFailed && tokenLogoUrl}
			<img
				src={normalizedTokenLogo}
				alt={tokenSymbol ?? 'token icon'}
				class="h-full w-full object-cover"
				onerror={() => {
					tokenFailed = true;
				}}
			/>
		{:else}
			<div
				class="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-500 dark:text-zinc-200"
			>
				{tokenSymbol?.slice(0, 3) ?? '?'}
			</div>
		{/if}
	</div>
</div>
