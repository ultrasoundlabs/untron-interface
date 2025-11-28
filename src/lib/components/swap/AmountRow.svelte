<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button/index.js';
	import { m } from '$lib/paraglide/messages.js';
	import type { SupportedChain, SupportedToken, TronToken } from '$lib/types/swap';

	interface Props {
		/** Whether this is the source (input) or destination (output) row */
		isSource: boolean;
		/** Whether this row is for Tron (fixed, non-selectable) */
		isTron: boolean;
		/** Amount value (for source: editable, for destination: read-only) */
		amount: string;
		/** Placeholder text for the input */
		placeholder?: string;
		/** Token info (Tron or EVM) */
		token: SupportedToken | TronToken;
		/** Chain info (only for EVM) */
		chain?: SupportedChain;
		/** Whether the token selector is disabled */
		selectorDisabled?: boolean;
		/** Whether the amount input is loading */
		isLoading?: boolean;
		/** Callback when amount changes (only for source) */
		onAmountChange?: (amount: string) => void;
		/** Callback when Max button is clicked */
		onMaxClick?: () => void;
		/** Callback when token selector is clicked */
		onTokenSelect?: () => void;
	}

	let {
		isSource,
		isTron,
		amount,
		placeholder = '0.00',
		token,
		chain,
		selectorDisabled = false,
		isLoading = false,
		onAmountChange,
		onMaxClick,
		onTokenSelect
	}: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		// Only allow numbers and decimals
		const value = target.value.replace(/[^0-9.]/g, '');
		// Prevent multiple decimals
		const parts = value.split('.');
		const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
		onAmountChange?.(sanitized);
	}

	const displayAmount = $derived(amount);
</script>

<div
	class="group relative rounded-2xl bg-zinc-100 p-4 transition-colors dark:bg-zinc-800/50"
	class:ring-2={isSource}
	class:ring-zinc-300={isSource}
	class:dark:ring-zinc-600={isSource}
>
	<!-- Label -->
	<div class="mb-2 flex items-center justify-between">
		<span class="text-sm text-zinc-500 dark:text-zinc-400">
			{isSource ? m.swap_you_send() : m.swap_you_receive()}
		</span>
		{#if isSource && onMaxClick}
			<Button
				variant="ghost"
				size="sm"
				class="h-6 px-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
				onclick={onMaxClick}
			>
				{m.swap_max()}
			</Button>
		{/if}
	</div>

	<div class="flex items-center gap-3">
		<!-- Amount Input/Display -->
		<div class="relative min-w-0 flex-1">
			{#if isSource}
				<input
					type="text"
					inputmode="decimal"
					value={displayAmount}
					{placeholder}
					oninput={handleInput}
					class="w-full bg-transparent text-3xl font-semibold text-zinc-900 placeholder-zinc-400 outline-none dark:text-white dark:placeholder-zinc-500"
				/>
			{:else}
				<div class="flex items-center">
					{#if isLoading}
						<div
							class="h-8 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700"
							in:fade={{ duration: 150 }}
						></div>
					{:else}
						<span
							class="text-3xl font-semibold text-zinc-900 dark:text-white"
							in:fade={{ duration: 150 }}
						>
							{displayAmount || '0.00'}
						</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Token Selector -->
		<button
			type="button"
			onclick={() => onTokenSelect?.()}
			disabled={selectorDisabled || isTron}
			class="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 transition-all duration-150
				{isTron ? 'cursor-default bg-zinc-200 dark:bg-zinc-700/50' : 'bg-white shadow-sm dark:bg-zinc-700'}
				{!isTron && !selectorDisabled ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-600' : ''}
				{selectorDisabled && !isTron ? 'cursor-default' : ''}"
		>
			<!-- Token Logo -->
			<div class="relative h-7 w-7 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-600">
				<img
					src={token.logoUrl}
					alt={token.symbol}
					class="h-full w-full object-cover"
					onerror={(e) => {
						(e.target as HTMLImageElement).style.display = 'none';
					}}
				/>
			</div>

			<!-- Token & Chain Info -->
			<div class="flex flex-col items-start">
				<span class="text-sm font-semibold text-zinc-900 dark:text-white">
					{token.symbol}
				</span>
				{#if chain}
					<span class="text-xs text-zinc-500 dark:text-zinc-400">
						{chain.name}
					</span>
				{:else if isTron}
					<span class="text-xs text-zinc-500 dark:text-zinc-400">Tron</span>
				{/if}
			</div>

			<!-- Dropdown Arrow (only for EVM) -->
			{#if !isTron && !selectorDisabled}
				<svg
					class="ml-1 h-4 w-4 text-zinc-400 transition-transform group-hover:translate-y-0.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					in:scale={{ duration: 150, start: 0.8 }}
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			{/if}
		</button>
	</div>
</div>
